import { useAppForm } from "@/components/form/form-context";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  createUserSchema,
  updateUserSchema,
} from "../schemas/users.shared-schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (userId: string) => void;
};

export function CreateUser({ open, onOpenChange, itemId, onCreated }: Props) {
  const isUpdate = !!itemId;
  const schema = useMemo(
    () => (isUpdate ? updateUserSchema.omit({ id: true }) : createUserSchema),
    [isUpdate]
  );

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.users.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const form = useAppForm({
    defaultValues: getFormDefaults(schema, data),
    validators: {
      onChange: schema,
    },
    onSubmit: async ({ value }) => {
      if (isUpdate && itemId) {
        const parsedValue = updateUserSchema.parse({ id: itemId, ...value });

        await updateMutation.mutateAsync({
          ...parsedValue,
          password:
            parsedValue.password && parsedValue.password.length > 0
              ? parsedValue.password
              : undefined,
        });
      } else {
        await createMutation.mutateAsync(createUserSchema.parse(value));
      }
    },
  });

  useEffect(() => {
    form.reset(getFormDefaults(schema, data));
  }, [form, open, data, schema]);

  const onSuccess = (result?: { id: string }) => {
    queryClient.invalidateQueries(trpc.users.list.queryOptions({}));
    if (isUpdate) {
      queryClient.invalidateQueries(
        trpc.users.get.queryOptions({ id: itemId })
      );
    }
    if (!isUpdate && result?.id) {
      onCreated?.(result.id);
    }
    onOpenChange(false);
    toast.success("Saved successfully");
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.users.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.users.update.mutationOptions({ onSuccess, onError })
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (form.state.isSubmitting) {
          return;
        }
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Users</DialogTitle>
          <DialogDescription>
            {isUpdate ? "Update existing user" : "Create new user"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-8"
          onSubmit={(e) => {
            e.stopPropagation();
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.AppForm>
            <FieldGroup className="grid grid-cols-2 gap-x-6 gap-y-5">
              <form.AppField
                name="name"
                children={(field) => <field.TextField label="Name" />}
              />

              <form.AppField
                name="email"
                children={(field) => (
                  <field.TextField label="Email" type="email" />
                )}
              />

              <div className="col-span-2">
                <form.AppField
                  name="password"
                  children={(field) => (
                    <field.TextField
                      label={
                        isUpdate ? "Password (leave empty to keep)" : "Password"
                      }
                      type="password"
                    />
                  )}
                />
              </div>
            </FieldGroup>

            <DialogFooter>
              <form.SubmitButton />
            </DialogFooter>
          </form.AppForm>
        </form>
      </DialogContent>
    </Dialog>
  );
}
