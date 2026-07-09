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
import { useTRPC } from "@/trpc";
import { createFinancialAccountSchema } from "../schemas/financial-accounts.shared-schema";

type Props = {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemId?: string;
};

export function CreateFinancialAccount({ open, onOpenChange, itemId }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isUpdate = !!itemId;

  const { data } = useQuery(
    trpc.financialAccounts.get.queryOptions(
      { id: itemId! },
      { enabled: isUpdate, ...formQueryOptions },
    ),
  );

  const frolloAccounts = useQuery(
    trpc.financialAccounts.listFrolloAccounts.queryOptions(undefined, {
      enabled: open,
      staleTime: 5 * 60 * 1000,
      ...formQueryOptions,
    }),
  );

  const createAction = useMutation(
    trpc.financialAccounts.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions(),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.financialAccounts.get.queryOptions({ id: itemId }),
          );
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateAction = useMutation(
    trpc.financialAccounts.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions(),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.financialAccounts.get.queryOptions({ id: itemId }),
          );
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(createFinancialAccountSchema, data),
    validators: {
      onChange: createFinancialAccountSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateAction.mutateAsync({ id: itemId, ...value });
      } else {
        await createAction.mutateAsync(value);
      }
    },
  });

  useEffect(() => {
    form.reset(getFormDefaults(createFinancialAccountSchema, data));
  }, [form, open, data]);

  const isPending = form.state.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            Financial accounts
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update existing financial account"
              : "Create new financial account"}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-financial-account"
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
                name="name"
                children={(field) => <field.TextField label="Name" />}
              />

              <form.AppField
                name="frolloAccountId"
                children={(field) => (
                  <field.SelectField
                    label="Sync with bank account"
                    placeholder={
                      frolloAccounts.isPending
                        ? "Loading accounts..."
                        : undefined
                    }
                    items={(frolloAccounts.data ?? []).map((account) => ({
                      value: account.id,
                      label: (
                        <span className="flex items-baseline gap-2">
                          {account.name}
                          <span className="text-muted-foreground">
                            {account.accountNumber}
                          </span>
                        </span>
                      ),
                    }))}
                  />
                )}
              />
            </FieldGroup>
          </form.AppForm>
        </form>
        <DialogFooter>
          <Button
            form="create-financial-account"
            disabled={isPending}
            type="submit"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
