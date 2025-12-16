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
import { consolidationSchema } from "@/lib/trpc-schemas";
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
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type SchemaType = z.infer<typeof consolidationSchema>;

export const ConsolidateTransaction = ({
    transactionId,
    open,
    onOpenChange,
}: Props) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data: transaction } = useQuery(
        trpc.transactions.get.queryOptions({
            id: transactionId,
        })
    );

    const consolidateMutation = useMutation(
        trpc.transactions.consolidate.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries(
                    trpc.transactions.list.queryOptions({})
                );
                queryClient.invalidateQueries(
                    trpc.transactions.get.queryOptions({ id: transactionId })
                );
                queryClient.invalidateQueries(
                    trpc.transactions.statistics.queryOptions()
                );
                onOpenChange(false);
                toast.success(tc("savedSuccessfully"));
            },
            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const form = useForm<SchemaType>({
        resolver: zodResolver(consolidationSchema),
        defaultValues: {
            budgetCategory: undefined,
            consolidationGroup: undefined,
            projectId: undefined,
            isGst: true,
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedGroup = form.watch("consolidationGroup");

    const handleSubmit = (values: SchemaType) => {
        if (!transaction) return;
        consolidateMutation.mutate({ id: transaction.id, ...values });
    };

    const { data: projects } = useQuery(
        trpc.projects.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );

    useEffect(() => {
        if (!transaction) return;

        fillForm(form, {
            ...transaction,
            isGst: transaction.isGst ?? true,
            projectId: transaction.project?.id,
        });
    }, [transaction, form]);

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
                        disabled={consolidateMutation.isPending}
                        type="submit"
                        form="consolidate-transaction-form"
                    >
                        {consolidateMutation.isPending && (
                            <Loader2 className="animate-spin" />
                        )}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
