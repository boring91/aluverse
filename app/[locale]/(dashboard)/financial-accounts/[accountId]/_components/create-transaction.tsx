import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { transactionTypes } from "@/lib/constants";
import { createTransactionSchema } from "@/lib/trpc-schemas";
import { fillForm } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type SchemaType = z.input<typeof createTransactionSchema>;

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    accountId: string;
    itemId?: string;
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
        queryClient.invalidateQueries(
            trpc.transactions.list.queryOptions({ accountId })
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
    }, [data, form, isUpdate, open, accountId]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Sheet
            open={open}
            onOpenChange={value => {
                if (isPending) return;
                if (!value) form.reset();
                onOpenChange(value);
            }}
        >
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>{t("transactions")}</SheetTitle>
                    <SheetDescription>
                        {isUpdate
                            ? t("updateExistingTransaction")
                            : t("createNewTransaction")}
                    </SheetDescription>
                </SheetHeader>

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

                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="justify-start"
                                                >
                                                    {field.value?.toDateString() ??
                                                        "-"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                />
                                            </PopoverContent>
                                        </Popover>

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

                <SheetFooter>
                    <Button type="submit" form="create-transaction-form">
                        {(createMutation.isPending ||
                            updateMutation.isPending) && (
                            <Loader2 className="animate-spin" />
                        )}
                        <span>{tc("save")}</span>
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};
