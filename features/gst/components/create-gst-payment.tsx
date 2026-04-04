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
import { createGstPaymentSchema } from "../schemas/gst.shared-schema";
import { GST_RATE } from "@/lib/constants";

type SchemaType = z.infer<typeof createGstPaymentSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
};

export function CreateGstPayment({ open, onOpenChange, itemId }: Props) {
  const isUpdate = !!itemId;
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.gst.getPayment.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const createMutation = useMutation(
    trpc.gst.createPayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.gst.listPayments.queryOptions({}));
        onOpenChange(false);
        toast.success("Saved successfully");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const updateMutation = useMutation(
    trpc.gst.updatePayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.gst.listPayments.queryOptions({}));
        if (isUpdate) {
          queryClient.invalidateQueries(
            trpc.gst.getPayment.queryOptions({ id: itemId })
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
      createGstPaymentSchema,
      isUpdate
        ? data
          ? { ...data, amount: data.amount / 100 }
          : data
        : { rate: GST_RATE }
    ),
    validators: {
      onChange: createGstPaymentSchema,
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
        createGstPaymentSchema,
        isUpdate
          ? data
            ? { ...data, amount: data.amount / 100 }
            : data
          : { rate: GST_RATE }
      )
    );
  }, [form, open, data, isUpdate]);

  const isPending = form.state.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>GST Payment</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update existing GST payment"
              : "Record a new GST payment"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="grid grid-cols-1 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
        >
          <form.AppForm>
            <FieldGroup className="contents">
              <form.AppField
                name="periodFrom"
                children={(field) => (
                  <field.DatePickerField label="Period from (inclusive)" />
                )}
              />

              <form.AppField
                name="periodTo"
                children={(field) => (
                  <field.DatePickerField label="Period to (exclusive)" />
                )}
              />

              <form.AppField
                name="rate"
                children={(field) => <field.NumberField label="GST rate" />}
              />

              <form.AppField
                name="amount"
                children={(field) => <field.NumberField label="Amount paid" />}
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
