"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { useAppForm } from "@/components/form/form-context";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loanTypes } from "@/lib/constants";
import { formQueryOptions } from "@/lib/client-utils";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { createLoanSchema } from "../schemas/loans.shared-schema";

type SchemaType = z.infer<typeof createLoanSchema>;

type PrefillData = {
  date: Date;
  amount: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (loanId: string) => void;
  prefillData?: PrefillData;
};

const LOAN_TYPE_LABELS: Record<(typeof loanTypes)[number], string> = {
  lent: "Lent",
  borrowed: "Borrowed",
};

export function CreateLoan({
  open,
  onOpenChange,
  itemId,
  onCreated,
  prefillData,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loans.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.loans.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.loans.get.queryOptions({ id: itemId })
          );
        }
        if (!isUpdate && created?.id) {
          onCreated?.(created.id);
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.loans.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.loans.get.queryOptions({ id: itemId })
          );
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(
      createLoanSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : prefillData
          ? { type: "lent", ...prefillData }
          : { type: "lent" }
    ),
    validators: {
      onChange: createLoanSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({ id: itemId, ...value });
      } else {
        await createMutation.mutateAsync(value as SchemaType);
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createLoanSchema,
        isUpdate
          ? data
            ? { ...data, amount: data.amount / 100 }
            : data
          : prefillData
            ? { type: "lent", ...prefillData }
            : { type: "lent" }
      )
    );
  }, [form, open, data, isUpdate, prefillData]);

  const isPending = form.state.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Loans</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing loan" : "Create new loan"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid grid-cols-1 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
        >
          <form.AppForm>
            <FieldGroup className="contents">
              <form.AppField
                name="type"
                children={(field) => (
                  <field.SelectField
                    label="Type"
                    items={loanTypes.map((type) => ({
                      value: type,
                      label: LOAN_TYPE_LABELS[type],
                    }))}
                  />
                )}
              />

              <form.AppField
                name="partyName"
                children={(field) => <field.TextField label="Party name" />}
              />

              <form.AppField
                name="amount"
                children={(field) => <field.NumberField label="Amount" />}
              />

              <form.AppField
                name="date"
                children={(field) => <field.DatePickerField label="Date" />}
              />

              <form.AppField
                name="dueDate"
                children={(field) => <field.DatePickerField label="Due date" />}
              />

              <form.AppField
                name="notes"
                children={(field) => (
                  <field.TextareaField label="Description" />
                )}
              />
            </FieldGroup>

            <DialogFooter>
              <Button disabled={isPending} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
