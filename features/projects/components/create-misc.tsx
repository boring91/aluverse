import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { fillForm } from "@/lib/client-utils";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createProjectMiscSchema } from "../schemas/project-items.schema";
import { TextInput } from "@/components/form/text-input";
import { NumberInput } from "@/components/form/number-input";

type SchemaType = z.infer<typeof createProjectMiscSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  itemId: string | null;
  onItemCreated?: (itemId: string) => void;
};

export const CreateMisc = ({
  open,
  onOpenChange,
  projectId,
  itemId,
  onItemCreated,
}: Props) => {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm({
    resolver: zodResolver(createProjectMiscSchema),
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projectMisc.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
      }
    )
  );

  const onSuccess = (data: { id: string }) => {
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
    } else {
      // Call onItemCreated callback with the newly created item ID
      const createdItem = data;
      if (createdItem && onItemCreated) {
        onItemCreated(createdItem.id);
      }
    }
    form.reset();
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.projectMisc.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.projectMisc.update.mutationOptions({ onSuccess, onError })
  );

  const handleSubmit = (data: SchemaType) => {
    if (isUpdate && itemId) {
      updateMutation.mutate({ id: itemId, ...data });
    } else {
      createMutation.mutate({ projectId, ...data });
    }
  };

  useEffect(() => {
    if (!data || !isUpdate) return;

    fillForm(form, { ...data, amount: data.amount / 100 });
  }, [data, form, isUpdate]);

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{t("misc")}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t("updateExistingMisc") : t("createNewMisc")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-misc-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-8 px-4 overflow-y-auto"
        >
          <FieldGroup>
            {/* Name */}
            <TextInput name="name" label={tc("name")} control={form.control} />

            {/* Amount */}
            <NumberInput
              name="amount"
              label={t("amount")}
              control={form.control}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button disabled={isPending} type="submit" form="create-misc-form">
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
