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
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { transactionTypes } from "@/lib/constants";
import { createTransactionSchema } from "../schemas/transactions.schema";
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
import { DatePickerInput } from "@/components/date-picker-input";

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
        defaultValues: {
            description: "",
            amount: 0.0,
            type: "expense",
        },
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.transactions.get.queryOptions(
            { id: itemId! },
            {
                enabled: isUpdate,
            }
        )
    );

    const onSuccess = () => {
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
            trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(
            trpc.financialAccounts.list.queryOptions()
        );
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
            onOpenChange={value => {
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
                        <Controller
                            control={form.control}
                            name="date"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{tc("date")}</FieldLabel>

                                        <DatePickerInput {...field} />

                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        ></Controller>

                        {/* Type */}
                        <Controller
                            control={form.control}
                            name="type"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("transactionType")}
                                        </FieldLabel>
                                        <Select
                                            {...field}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue></SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {transactionTypes.map(
                                                        type => {
                                                            return (
                                                                <SelectItem
                                                                    key={type}
                                                                    value={type}
                                                                >
                                                                    {t(type)}
                                                                </SelectItem>
                                                            );
                                                        }
                                                    )}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        ></Controller>

                        {/* Amount */}
                        <Controller
                            control={form.control}
                            name="amount"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("amount")}</FieldLabel>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={v =>
                                                field.onChange(
                                                    v.target.value
                                                        ? parseFloat(
                                                              v.target.value
                                                          )
                                                        : ""
                                                )
                                            }
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        ></Controller>

                        {/* Description */}
                        <Controller
                            control={form.control}
                            name="description"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {tc("description")}
                                        </FieldLabel>
                                        <Input {...field} />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        ></Controller>
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="create-transaction-form"
                    >
                        {(createMutation.isPending ||
                            updateMutation.isPending) && (
                            <Loader2 className="animate-spin" />
                        )}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
