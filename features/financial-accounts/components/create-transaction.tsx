"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { createTransactionSchema } from "../schemas/transactions.schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  itemId?: string | null;
};

export function CreateTransaction({
  open,
  onOpenChange,
  accountId,
  itemId,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.transactions.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.transactions.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.get.queryOptions({ id: accountId })
        );

        if (isUpdate && itemId) {
          queryClient.invalidateQueries(
            trpc.transactions.get.queryOptions({ id: itemId })
          );
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.get.queryOptions({ id: accountId })
        );

        if (isUpdate && itemId) {
          queryClient.invalidateQueries(
            trpc.transactions.get.queryOptions({ id: itemId })
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
      createTransactionSchema,
      data ? { ...data, amount: data.amount / 100 } : data
    ),
    validators: {
      onChange: createTransactionSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({
          ...value,
          id: itemId,
        });
      } else {
        await createMutation.mutateAsync({
          ...value,
          accountId,
        });
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createTransactionSchema,
        data ? { ...data, amount: data.amount / 100 } : data
      )
    );
  }, [form, open, data]);

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
          <DialogTitle>Transactions</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update existing transaction"
              : "Create new transaction"}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-transaction-form"
          className="flex flex-col gap-8 px-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
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
                name="description"
                children={(field) => <field.TextField label="Description" />}
              />
            </FieldGroup>
          </form.AppForm>
        </form>

        <DialogFooter>
          <Button
            disabled={isPending}
            type="submit"
            form="create-transaction-form"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
