"use client";

import { DatePickerInput } from "@/components/date-picker-input";
import { Button } from "@/components/ui/button";
import {
    FieldGroup,
    Field,
    FieldLabel,
    FieldError,
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
import { Textarea } from "@/components/ui/textarea";
import { fillForm } from "@/lib/client-utils";
import { createLoanSchema } from "../schemas/loan.schemas";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { loanTypes } from "@/lib/constants";

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
            partyName: "",
            amount: 0,
            notes: "",
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
        form.reset();
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
        if (!data || !isUpdate) return;

        fillForm(form, { ...data, amount: data.amount / 100 });
    }, [data, form, isUpdate]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) {
                    form.reset();
                }
                onOpenChange(value);
            }}
        >
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>{t("loans")}</DialogTitle>
                    <DialogDescription>
                        {isUpdate
                            ? t("updateExistingLoan")
                            : t("createNewLoan")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-loan-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="grid grid-cols-1 gap-4 px-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
                >
                    <FieldGroup className="contents">
                        {/* Type */}
                        <Controller
                            control={form.control}
                            name="type"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("type")}</FieldLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {loanTypes.map(type => (
                                                        <SelectItem
                                                            key={type}
                                                            value={type}
                                                        >
                                                            {t(type)}
                                                        </SelectItem>
                                                    ))}
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
                        />

                        {/* Party Name */}
                        <Controller
                            control={form.control}
                            name="partyName"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("partyName")}
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
                        />

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
                        />

                        {/* Date */}
                        <Controller
                            control={form.control}
                            name="date"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{tc("date")}</FieldLabel>
                                        <DatePickerInput
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />

                        {/* Due Date */}
                        <Controller
                            control={form.control}
                            name="dueDate"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>{t("dueDate")}</FieldLabel>
                                        <DatePickerInput
                                            value={field.value ?? undefined}
                                            onChange={field.onChange}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />

                        {/* Notes */}
                        <Controller
                            control={form.control}
                            name="notes"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {tc("description")}
                                        </FieldLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? undefined}
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                );
                            }}
                        />
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="create-loan-form"
                    >
                        {(createMutation.isPending ||
                            updateMutation.isPending) && (
                            <Loader2 className="animate-spin" />
                        )}
                        {tc("save")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
