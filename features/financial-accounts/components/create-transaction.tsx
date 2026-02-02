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
import { createTransactionSchema } from "../schemas/transactions.schema";
import { fillForm } from "@/lib/client-utils";
import { formQueryOptions } from "@/lib/query-utils";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { DateInput } from "@/components/form/date-input";
import { SelectInput } from "@/components/form/select-input";
import { NumberInput } from "@/components/form/number-input";
import { TextInput } from "@/components/form/text-input";

type SchemaType = z.input<typeof createTransactionSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
  itemId?: string | null;
};

export const CreateTransaction = ({
  open,
  onOpenChange,
  accountId,
  itemId,
}: Props) => {
  const t = useTranslations("FinancialAccounts");
  const tc = useTranslations("Common");

  const isUpdate = !!itemId;

  const form = useForm<SchemaType>({
    resolver: zodResolver(createTransactionSchema),
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.transactions.get.queryOptions(
      { id: itemId! },
      {
        enabled: isUpdate,
        ...formQueryOptions,
      }
    )
  );

  const onSuccess = () => {
    queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
    queryClient.invalidateQueries(
      trpc.consolidations.statistics.queryOptions()
    );
    queryClient.invalidateQueries(trpc.financialAccounts.list.queryOptions());
    queryClient.invalidateQueries(
      trpc.financialAccounts.get.queryOptions({ id: accountId })
    );

    if (isUpdate && itemId) {
      queryClient.invalidateQueries(
        trpc.transactions.get.queryOptions({ id: itemId })
      );
    }

    form.reset();
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.transactions.create.mutationOptions({
      onSuccess,
      onError,
    })
  );

  const updateMutation = useMutation(
    trpc.transactions.update.mutationOptions({
      onSuccess,
      onError,
    })
  );

  const handleSubmit = (values: SchemaType) => {
    if (isUpdate && itemId) {
      updateMutation.mutate({
        ...values,
        id: itemId,
      });
    } else {
      createMutation.mutate({
        ...values,
        accountId: accountId,
      });
    }
  };

  useEffect(() => {
    if (!data || !isUpdate) return;

    fillForm(form, { ...data, amount: data.amount / 100 });
  }, [data, form, isUpdate, accountId]);

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
          <DialogTitle>{t("transactions")}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? t("updateExistingTransaction")
              : t("createNewTransaction")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-transaction-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-8 px-4"
        >
          <FieldGroup>
            {/* Date */}
            <DateInput name="date" label={tc("date")} control={form.control} />

            {/* Amount */}
            <NumberInput
              name="amount"
              label={t("amount")}
              control={form.control}
            />

            {/* Description */}
            <TextInput
              name="description"
              label={tc("description")}
              control={form.control}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            disabled={isPending}
            type="submit"
            form="create-transaction-form"
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="animate-spin" />
            )}
            <span>{tc("save")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
