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
import { formQueryOptions } from "@/lib/client-utils";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { createLoanPayoffSchema } from "../schemas/loan-payoffs.shared-schema";

type SchemaType = z.infer<typeof createLoanPayoffSchema>;

type PrefillData = {
  date: Date;
  amount: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
  prefillData?: PrefillData;
};

export function CreateLoanPayoff({
  open,
  onOpenChange,
  loanId,
  itemId,
  onItemCreated,
  prefillData,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loanPayoffs.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.loanPayoffs.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.loanPayoffs.list.queryOptions({ loanId })
        );
        queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.loans.get.queryOptions({ id: loanId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.loanPayoffs.get.queryOptions({ id: itemId })
          );
        } else if (created && onItemCreated) {
          onItemCreated(created.id);
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.loanPayoffs.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.loanPayoffs.list.queryOptions({ loanId })
        );
        queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.loans.get.queryOptions({ id: loanId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.loanPayoffs.get.queryOptions({ id: itemId })
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
      createLoanPayoffSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : prefillData
          ? prefillData
          : { amount: 0, notes: "" }
    ),
    validators: {
      onChange: createLoanPayoffSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({ id: itemId, ...value });
      } else {
        await createMutation.mutateAsync({ loanId, ...value } as SchemaType & {
          loanId: string;
        });
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createLoanPayoffSchema,
        isUpdate
          ? data
            ? { ...data, amount: data.amount / 100 }
            : data
          : prefillData
            ? prefillData
            : { amount: 0, notes: "" }
      )
    );
  }, [form, open, data, isUpdate, prefillData]);

  const isPending = form.state.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        if (!value) form.reset();
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payoffs</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing payoff" : "Create new payoff"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-8 px-4 overflow-y-auto"
        >
          <form.AppForm>
            <FieldGroup>
              <form.AppField
                name="date"
                children={(field) => <field.DatePickerField label="Date" />}
              />

              <form.AppField
                name="amount"
                children={(field) => <field.NumberField label="Amount" />}
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
