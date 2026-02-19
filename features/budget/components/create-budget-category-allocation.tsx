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
import { createBudgetCategoryAllocationSchema } from "../schemas/budgets.shared-schema";

type SchemaType = z.infer<typeof createBudgetCategoryAllocationSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetCategoryId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
};

export function CreateBudgetCategoryAllocation({
  open,
  onOpenChange,
  budgetCategoryId,
  itemId,
  onItemCreated,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.budgetCategoryAllocations.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.budgetCategoryAllocations.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.budgetCategoryAllocations.list.queryOptions({ budgetCategoryId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.budgetCategoryAllocations.get.queryOptions({ id: itemId })
          );
        } else if (created?.id) {
          onItemCreated?.(created.id);
        }

        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.budgetCategoryAllocations.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.budgetCategoryAllocations.list.queryOptions({ budgetCategoryId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.budgetCategoryAllocations.get.queryOptions({ id: itemId })
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
      createBudgetCategoryAllocationSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : { amount: 0, effectiveDate: new Date() }
    ),
    validators: {
      onChange: createBudgetCategoryAllocationSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({ id: itemId, ...value });
      } else {
        await createMutation.mutateAsync({
          budgetCategoryId,
          ...value,
        } as SchemaType & { budgetCategoryId: string });
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createBudgetCategoryAllocationSchema,
        isUpdate
          ? data
            ? { ...data, amount: data.amount / 100 }
            : data
          : { amount: 0, effectiveDate: new Date() }
      )
    );
  }, [form, open, data, isUpdate]);

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
          <DialogTitle>Allocations</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing allocation" : "Create new allocation"}
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
                name="effectiveDate"
                children={(field) => (
                  <field.DatePickerField label="Effective date" />
                )}
              />

              <form.AppField
                name="amount"
                children={(field) => <field.NumberField label="Amount" />}
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
