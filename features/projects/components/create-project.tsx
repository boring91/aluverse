"use client";

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
import { fillForm } from "@/lib/client-utils";
import { createProjectSchema } from "../schemas/projects.schema";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { TextInput } from "@/components/form/text-input";
import { NumberInput } from "@/components/form/number-input";
import { DateInput } from "@/components/form/date-input";

type SchemaType = z.infer<typeof createProjectSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (projectId: string) => void;
};

export const CreateProject = ({
  open,
  onOpenChange,
  itemId,
  onCreated,
}: Props) => {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm<SchemaType>({
    resolver: zodResolver(createProjectSchema),
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projects.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
      }
    )
  );

  const onSuccess = (data?: { id: string }) => {
    queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
    if (isUpdate) {
      queryClient.invalidateQueries(
        trpc.projects.get.queryOptions({ id: itemId })
      );
    }
    if (!isUpdate && data?.id) {
      onCreated?.(data.id);
    }
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.projects.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.projects.update.mutationOptions({ onSuccess, onError })
  );

  const handleSubmit = (data: SchemaType) => {
    if (isUpdate && itemId) {
      updateMutation.mutate({ id: itemId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  useEffect(() => {
    if (!open) {
      form.reset();
      return;
    }
    if (!data || !isUpdate) return;

    fillForm(form, { ...data, price: data.price / 100 });
  }, [data, form, isUpdate, open]);

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{t("projects")}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t("updateExistingProject") : t("createNewProject")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            form.handleSubmit(handleSubmit)(e);
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
        >
          <FieldGroup className="contents">
            {/* Client */}
            <TextInput
              name="client"
              label={t("client")}
              control={form.control}
            />

            {/* Title */}
            <TextInput name="title" label={t("title")} control={form.control} />

            {/* Address */}
            <TextInput
              name="address"
              label={t("address")}
              control={form.control}
            />

            {/* Meters */}
            <NumberInput
              name="meters"
              label={t("meters")}
              control={form.control}
            />

            {/* Price */}
            <NumberInput
              name="price"
              label={t("price")}
              control={form.control}
            />

            {/* Visit Date */}
            <DateInput
              name="visitDate"
              label={t("visitDate")}
              control={form.control}
            />

            {/* Start Date */}
            <DateInput
              name="startDate"
              label={t("startDate")}
              control={form.control}
            />

            {/* End Date */}
            <DateInput
              name="endDate"
              label={t("endDate")}
              control={form.control}
            />

            {/* Margin */}
            <NumberInput
              name="margin"
              label={t("margin")}
              control={form.control}
            />

            {/* Budget Units */}
            <NumberInput
              name="budgetUnits"
              label={t("budgetUnits")}
              control={form.control}
            />
          </FieldGroup>

          <DialogFooter className="col-span-full">
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
