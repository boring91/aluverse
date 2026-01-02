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
import { createFinancialAccountSchema } from "../schemas/financial-accounts.schema";
import { fillForm } from "@/lib/client-utils";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { banks } from "../lib/bank-syncer/constants";
import { SelectInput } from "@/components/form/select-input";
import { TextInput } from "@/components/form/text-input";
import { useForm } from "react-hook-form";

type SchemaType = z.infer<typeof createFinancialAccountSchema>;

type Props = {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemId?: string;
};

export const CreateFinancialAccount = ({
  open,
  onOpenChange,
  itemId,
}: Props) => {
  const t = useTranslations("FinancialAccounts");
  const tc = useTranslations("Common");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isUpdate = !!itemId;

  const { data } = useQuery(
    trpc.financialAccounts.get.queryOptions(
      { id: itemId! },
      { enabled: isUpdate }
    )
  );

  const form = useForm<SchemaType>({
    resolver: zodResolver(createFinancialAccountSchema),
    defaultValues: {
      name: "",
      syncWithBank: undefined,
    },
  });

  const onSuccess = () => {
    queryClient.invalidateQueries(trpc.financialAccounts.list.queryOptions());
    if (isUpdate) {
      queryClient.invalidateQueries(
        trpc.financialAccounts.get.queryOptions({ id: itemId })
      );
    }
    onOpenChange(false);
    toast.success(tc("savedSuccessfully"));
  };

  const onError = (error: { message: string }) => {
    toast.error(error.message);
  };

  const createMutation = useMutation(
    trpc.financialAccounts.create.mutationOptions({ onSuccess, onError })
  );
  const updateMutation = useMutation(
    trpc.financialAccounts.update.mutationOptions({ onSuccess, onError })
  );
  const isPending = createMutation.isPending || updateMutation.isPending;

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

    if (!isUpdate || !data) return;

    fillForm(form, data);
  }, [isUpdate, data, form, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isPending) return;
        onOpenChange(value);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold text-xl">
            {tc("financialAccounts")}
          </DialogTitle>
          <DialogDescription>
            {isUpdate
              ? t("updateExistingFinancialAccount")
              : t("createNewFinancialAccount")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="create-financial-account"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-8 px-4"
        >
          <FieldGroup>
            {/* Name */}
            <TextInput name="name" label={tc("name")} control={form.control} />

            {/* Sync with bank */}
            <SelectInput
              name="syncWithBank"
              label={t("syncWithBank")}
              control={form.control}
              items={banks.map((bank) => ({ value: bank, label: t(bank) }))}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            form="create-financial-account"
            disabled={isPending}
            type="submit"
          >
            {isPending && <Loader2 className="animate-spin" />}
            <span>{tc("save")}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
