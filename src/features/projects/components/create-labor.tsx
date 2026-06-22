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
import { createProjectLaborSchema } from "../schemas/project-items.shared-schema";

type PrefillData = {
  name: string;
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

export function CreateLabor({
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
    trpc.projectLabors.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      },
    ),
  );

  const createAction = useMutation(
    trpc.projectLabors.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.projectLabors.list.queryOptions({ projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId }),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectLabors.get.queryOptions({ id: itemId }),
          );
        } else if (created && onItemCreated) {
          onItemCreated(created.id);
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateAction = useMutation(
    trpc.projectLabors.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projectLabors.list.queryOptions({ projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId }),
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectLabors.get.queryOptions({ id: itemId }),
          );
        }
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(
      createProjectLaborSchema,
      isUpdate
        ? data
          ? { ...data, rate: data.rate / 100 }
          : data
        : prefillData
          ? { name: prefillData.name, hours: 1, rate: prefillData.amount }
          : undefined,
    ),
    validators: {
      onChange: createProjectLaborSchema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        await updateAction.mutateAsync({ id: itemId, ...value });
      } else {
        await createAction.mutateAsync({
          projectId,
          ...value,
        });
      }
    },
  });

  useEffect(() => {
    form.reset(
      getFormDefaults(
        createProjectLaborSchema,
        isUpdate
          ? data
            ? { ...data, rate: data.rate / 100 }
            : data
          : prefillData
            ? { name: prefillData.name, hours: 1, rate: prefillData.amount }
            : undefined,
      ),
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
          <DialogTitle>Labors</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing labor" : "Create new labor"}
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
                name="hours"
                children={(field) => <field.NumberField label="Hours" />}
              />
              <form.AppField
                name="rate"
                children={(field) => <field.NumberField label="Rate" />}
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
