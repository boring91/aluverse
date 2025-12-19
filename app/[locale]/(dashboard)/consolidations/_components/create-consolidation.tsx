import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { fillForm } from "@/lib/client-utils";
import {
    transactionBudgetCategories,
    transactionConsolidationGroups,
} from "@/lib/constants";
import { createConsolidationSchema } from "@/lib/trpc-schemas";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type Props = {
    transactionId: string;
    itemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SchemaType = z.infer<typeof createConsolidationSchema>;

export const CreateConsolidation = ({
    transactionId,
    itemId,
    open,
    onOpenChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const isUpdate = !!itemId;

    const form = useForm<SchemaType>({
        resolver: zodResolver(createConsolidationSchema),
        defaultValues: {
            amount: 0.0,
            budgetCategory: undefined,
            consolidationGroup: undefined,
            projectId: undefined,
            isGst: true,
        },
    });

    const queryClient = useQueryClient();
    const trpc = useTRPC();

    const { data } = useQuery(
        trpc.consolidations.get.queryOptions(
            {
                id: itemId!,
            },
            {
                enabled: isUpdate,
            }
        )
    );

    const onSuccess = () => {
        queryClient.invalidateQueries(
            trpc.consolidations.list.queryOptions({ transactionId })
        );
        queryClient.invalidateQueries(
            trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        if (isUpdate) {
            queryClient.invalidateQueries(
                trpc.consolidations.get.queryOptions({
                    id: itemId,
                })
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
        trpc.consolidations.create.mutationOptions({ onSuccess, onError })
    );
    const updateMutation = useMutation(
        trpc.consolidations.update.mutationOptions({ onSuccess, onError })
    );

    const handleSubmit = (data: SchemaType) => {
        console.log({ data });
        if (isUpdate && itemId) {
            updateMutation.mutate({ id: itemId, ...data });
        } else {
            createMutation.mutate({ transactionId, ...data });
        }
    };

    useEffect(() => {
        if (!data || !isUpdate) return;

        fillForm(form, {
            ...data,
            amount: data.amount / 100,
            isGst: data.isGst ?? true,
            projectId: data.project?.id,
        });
    }, [data, form, isUpdate]);

    const { data: projects } = useQuery(
        trpc.projects.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedGroup = form.watch("consolidationGroup");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t("consolidateTransaction")}</DialogTitle>
                    <DialogDescription>
                        {t("consolidateTransactionDetails")}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="consolidate-transaction-form"
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="flex flex-col gap-8 px-4"
                >
                    <FieldGroup>
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

                        {/* Consolidation group */}
                        <Controller
                            control={form.control}
                            name="consolidationGroup"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field>
                                        <FieldLabel>
                                            {t("consolidationGroup")}
                                        </FieldLabel>

                                        <Select
                                            value={field.value ?? ""}
                                            onValueChange={value => {
                                                field.onChange(value);

                                                if (value !== "budget")
                                                    form.setValue(
                                                        "budgetCategory",
                                                        undefined
                                                    );

                                                if (value !== "project")
                                                    form.setValue(
                                                        "projectId",
                                                        undefined
                                                    );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {transactionConsolidationGroups.map(
                                                        group => {
                                                            return (
                                                                <SelectItem
                                                                    key={group}
                                                                    value={
                                                                        group
                                                                    }
                                                                >
                                                                    {t(group)}
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
                        />

                        {/* Budget category */}
                        {selectedGroup === "budget" && (
                            <Controller
                                control={form.control}
                                name="budgetCategory"
                                render={({ field, fieldState }) => {
                                    return (
                                        <Field>
                                            <FieldLabel>
                                                {t("budgetCategory")}
                                            </FieldLabel>

                                            <Select
                                                value={field.value ?? ""}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {transactionBudgetCategories.map(
                                                            category => {
                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            category
                                                                        }
                                                                        value={
                                                                            category
                                                                        }
                                                                    >
                                                                        {t(
                                                                            category
                                                                        )}
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
                            />
                        )}

                        {/* Project */}
                        {selectedGroup === "project" && (
                            <Controller
                                control={form.control}
                                name="projectId"
                                render={({ field, fieldState }) => {
                                    return (
                                        <Field>
                                            <FieldLabel>
                                                {t("project")}
                                            </FieldLabel>

                                            <Select
                                                value={field.value ?? ""}
                                                onValueChange={field.onChange}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {projects?.items.map(
                                                            project => {
                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            project.id
                                                                        }
                                                                        value={
                                                                            project.id
                                                                        }
                                                                    >
                                                                        {`${project.humanId} - ${project.title}`}
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
                            />
                        )}

                        {/* Is GST */}
                        <Controller
                            control={form.control}
                            name="isGst"
                            render={({ field, fieldState }) => {
                                return (
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="gst-checkbox"
                                            checked={field.value ?? false}
                                            onCheckedChange={field.onChange}
                                        />

                                        <FieldLabel htmlFor="gst-checkbox">
                                            {t("isGst")}
                                        </FieldLabel>

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
                        disabled={createMutation.isPending}
                        type="submit"
                        form="consolidate-transaction-form"
                    >
                        {createMutation.isPending && (
                            <Loader2 className="animate-spin" />
                        )}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
