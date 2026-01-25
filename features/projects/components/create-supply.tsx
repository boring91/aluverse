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
import { createProjectSupplySchema } from "../schemas/project-items.schema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { NumberInput } from "@/components/form/number-input";
import { TextInput } from "@/components/form/text-input";

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

export const CreateSupply = ({
  open,
  onOpenChange,
  projectId,
  itemId,
  onItemCreated,
  prefillData,
}: Props) => {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm({
    resolver: zodResolver(createProjectSupplySchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projectSupplies.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
      }
    )
  );

  const onSuccess = (data: { id: string }) => {
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
    trpc.projectSupplies.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.projectSupplies.update.mutationOptions({ onSuccess, onError })
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

    fillForm(form, { ...data, unitPrice: data.unitPrice / 100 });
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
      <DialogContent
        onOpenAutoFocus={() => {
          if (prefillData && !isUpdate) {
            fillForm(form, prefillData);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("supplies")}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t("updateExistingSupply") : t("createNewSupply")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(handleSubmit)(e);
          }}
          className="flex flex-col gap-8 px-4 overflow-y-auto"
        >
          <FieldGroup>
            {/* Name */}
            <TextInput name="name" label={tc("name")} control={form.control} />

            {/* Quantity */}
            <NumberInput
              name="quantity"
              label={t("quantity")}
              control={form.control}
            />

            {/* Unit Price */}
            <NumberInput
              name="unitPrice"
              label={t("unitPrice")}
              control={form.control}
            />
          </FieldGroup>

          <DialogFooter>
            <Button disabled={isPending} type="submit">
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="animate-spin" />
              )}
              {tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
