"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { banks } from "../lib/bank-syncer/constants";

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
    form.reset();
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
    if (!isUpdate || !data) return;

    fillForm(form, data);
  }, [isUpdate, data, form]);

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
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => {
                return (
                  <Field>
                    <FieldLabel>{tc("name")}</FieldLabel>
                    <Input {...field} />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            {/* Sync with bank */}
            <Controller
              control={form.control}
              name="syncWithBank"
              render={({ field, fieldState }) => {
                return (
                  <Field>
                    <FieldLabel>{t("syncWithBank")}</FieldLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {banks.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {t(bank)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
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
