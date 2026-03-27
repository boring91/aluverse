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
import { formQueryOptions } from "@/lib/client-utils";
import { getFormDefaults } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc/client";
import { createProjectSchema } from "../schemas/projects.shared-schema";

type SchemaType = z.infer<typeof createProjectSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (projectId: string) => void;
};

export function CreateProject({
  open,
  onOpenChange,
  itemId,
  onCreated,
}: Props) {
  const isUpdate = !!itemId;

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projects.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (created) => {
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projects.get.queryOptions({ id: itemId })
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
    trpc.projects.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.projects.get.queryOptions({ id: itemId })
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
      createProjectSchema,
      data ? { ...data, price: data.price / 100 } : data
    ),
    validators: {
      onChange: createProjectSchema,
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
        createProjectSchema,
        data ? { ...data, price: data.price / 100 } : data
      )
    );
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
      <DialogContent className="sm:max-w-[640px] md:max-w-3xl lg:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Projects</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing project" : "Create new project"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            e.preventDefault();
            form.handleSubmit();
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
        >
          <form.AppForm>
            <FieldGroup className="contents">
              <form.AppField
                name="client"
                children={(field) => <field.TextField label="Client" />}
              />

              <form.AppField
                name="title"
                children={(field) => <field.TextField label="Title" />}
              />

              <form.AppField
                name="address"
                children={(field) => <field.AddressField label="Address" />}
              />

              <form.AppField
                name="meters"
                children={(field) => <field.NumberField label="Meters" />}
              />

              <form.AppField
                name="price"
                children={(field) => (
                  <field.NumberField label="Price (including gst)" />
                )}
              />

              <form.AppField
                name="visitDate"
                children={(field) => (
                  <field.DatePickerField label="Visit date" />
                )}
              />

              <form.AppField
                name="startDate"
                children={(field) => (
                  <field.DatePickerField label="Start date" />
                )}
              />

              <form.AppField
                name="endDate"
                children={(field) => <field.DatePickerField label="End date" />}
              />

              <form.AppField
                name="margin"
                children={(field) => <field.NumberField label="Margin" />}
              />

              <form.AppField
                name="budgetUnits"
                children={(field) => <field.NumberField label="Budget units" />}
              />
            </FieldGroup>

            <DialogFooter className="col-span-full">
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
