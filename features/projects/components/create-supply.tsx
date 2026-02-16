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
import { createProjectSupplySchema } from "../schemas/project-items.schema";

type SchemaType = z.infer<typeof createProjectSupplySchema>;

type PrefillData = {
  name: string;
  unitPrice: number;
  quantity: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
  prefillData?: PrefillData;
};

export function CreateSupply({
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
    trpc.projectSupplies.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.projectSupplies.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.projectSupplies.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectSupplies.get.queryOptions({ id: itemId })
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
    trpc.projectSupplies.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projectSupplies.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectSupplies.get.queryOptions({ id: itemId })
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
      createProjectSupplySchema,
      isUpdate
        ? data
          ? { ...data, unitPrice: data.unitPrice / 100 }
          : data
        : (prefillData ?? { quantity: 1 })
    ),
    validators: {
      onChange: createProjectSupplySchema,
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
        createProjectSupplySchema,
        isUpdate
          ? data
            ? { ...data, unitPrice: data.unitPrice / 100 }
            : data
          : (prefillData ?? { quantity: 1 })
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
          <DialogTitle>Supplies</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing supply" : "Create new supply"}
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
                name="quantity"
                children={(field) => <field.NumberField label="Quantity" />}
              />
              <form.AppField
                name="unitPrice"
                children={(field) => <field.NumberField label="Unit price" />}
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
