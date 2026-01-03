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
import { createLoanSchema } from "../schemas/loan.schemas";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { loanTypes } from "@/lib/constants";
import { TextInput } from "@/components/form/text-input";
import { NumberInput } from "@/components/form/number-input";
import { DateInput } from "@/components/form/date-input";
import { TextareaInput } from "@/components/form/textarea-input";
import { SelectInput } from "@/components/form/select-input";

type SchemaType = z.infer<typeof createLoanSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  onCreated?: (loanId: string) => void;
};

export const CreateLoan = ({
  open,
  onOpenChange,
  itemId,
  onCreated,
}: Props) => {
  const t = useTranslations("Loans");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm<SchemaType>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      type: "lent",
    },
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loans.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
      }
    )
  );

  const onSuccess = (data?: { id: string }) => {
    queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
    if (isUpdate) {
      queryClient.invalidateQueries(
        trpc.loans.get.queryOptions({ id: itemId })
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
    trpc.loans.create.mutationOptions({ onSuccess, onError })
  );

  const updateMutation = useMutation(
    trpc.loans.update.mutationOptions({ onSuccess, onError })
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

    fillForm(form, { ...data, amount: data.amount / 100 });
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t("loans")}</DialogTitle>
          <DialogDescription>
            {isUpdate ? t("updateExistingLoan") : t("createNewLoan")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-loan-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid grid-cols-1 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
        >
          <FieldGroup className="contents">
            {/* Type */}
            <SelectInput
              name="type"
              label={t("type")}
              control={form.control}
              items={loanTypes.map((type) => ({ value: type, label: t(type) }))}
            />

            {/* Party Name */}
            <TextInput
              name="partyName"
              label={t("partyName")}
              control={form.control}
            />

            {/* Amount */}
            <NumberInput
              name="amount"
              label={t("amount")}
              control={form.control}
            />

            {/* Date */}
            <DateInput name="date" label={tc("date")} control={form.control} />

            {/* Due Date */}
            <DateInput
              name="dueDate"
              label={t("dueDate")}
              control={form.control}
            />

            {/* Notes */}
            <TextareaInput
              name="notes"
              label={tc("description")}
              control={form.control}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button disabled={isPending} type="submit" form="create-loan-form">
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
