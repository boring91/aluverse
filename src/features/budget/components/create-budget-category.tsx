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
import { createBudgetCategorySchema } from "../schemas/budgets.shared-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (itemId: string) => void;
};

export function CreateBudgetCategory({
  open,
  onOpenChange,
  itemId,
  onCreated,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.budgetCategories.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      },
    ),
  );

  const createAction = useMutation(
    trpc.budgetCategories.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.budgetCategories.list.queryOptions({}),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.budgetCategories.get.queryOptions({ id: itemId }),
          );
        }

        if (!isUpdate && created?.id) {
          onCreated?.(created.id);
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateAction = useMutation(
    trpc.budgetCategories.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.budgetCategories.list.queryOptions({}),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.budgetCategories.get.queryOptions({ id: itemId }),
          );
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(createBudgetCategorySchema, data),
    validators: {
      onChange: createBudgetCategorySchema,
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
    form.reset(getFormDefaults(createBudgetCategorySchema, data));
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
          <DialogTitle>Budget categories</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update existing budget category"
              : "Create new budget category"}
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
                name="name"
                children={(field) => <field.TextField label="Name" />}
              />

              <form.AppField
                name="includingGst"
                children={(field) => (
                  <field.CheckboxField label="Including GST" />
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
