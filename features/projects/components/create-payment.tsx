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
import { createProjectPaymentSchema } from "../schemas/project-items.shared-schema";

type SchemaType = z.infer<typeof createProjectPaymentSchema>;

type PrefillData = {
  date: Date;
  amount: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
  prefillData?: PrefillData;
};

export function CreatePayment({
  open,
  onOpenChange,
  projectId,
  itemId,
  onItemCreated,
  prefillData,
}: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projectPayments.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.projectPayments.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.projectPayments.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectPayments.get.queryOptions({ id: itemId })
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
    trpc.projectPayments.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projectPayments.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectPayments.get.queryOptions({ id: itemId })
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
      createProjectPaymentSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : prefillData
    ),
    validators: {
      onChange: createProjectPaymentSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateMutation.mutateAsync({ id: itemId, ...value });
      } else {
        await createMutation.mutateAsync({
          projectId,
          ...value,
        } as SchemaType & { projectId: string });
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createProjectPaymentSchema,
        isUpdate
          ? data
            ? { ...data, amount: data.amount / 100 }
            : data
          : prefillData
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
          <DialogTitle>Payments</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing payment" : "Create new payment"}
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
