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
import { createProjectMiscSchema } from "../schemas/project-items.schema";

type SchemaType = z.infer<typeof createProjectMiscSchema>;

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

export function CreateMisc({
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
    trpc.projectMisc.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.projectMisc.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(
          trpc.projectMisc.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectMisc.get.queryOptions({ id: itemId })
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
    trpc.projectMisc.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projectMisc.list.queryOptions({ projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projectMisc.get.queryOptions({ id: itemId })
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
      createProjectMiscSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : prefillData
    ),
    validators: {
      onChange: createProjectMiscSchema,
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
        createProjectMiscSchema,
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
          <DialogTitle>Misc</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing misc" : "Create new misc"}
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
