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
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { fillForm } from "@/lib/client-utils";
import {
    projectStreams,
    transactionBudgetCategories,
    transactionConsolidationGroups,
} from "@/lib/constants";
import { createConsolidationSchema } from "@/lib/trpc-schemas";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
    CreateProjectItem,
    CreateProjectItemHandle,
} from "./create-project-item";

type SchemaType = z.infer<typeof createConsolidationSchema>;

const useProjectItems = (form: UseFormReturn<SchemaType>) => {
    const trpc = useTRPC();

    const projectId = form.watch("projectId");
    const stream = form.watch("projectStream");

    const queryInput = {
        projectId: projectId!,
        pagination: { pageSize: -1, pageIndex: 0 },
    };

    const makeOptions = (enabled: boolean) => ({
        enabled: !!projectId && enabled,
    });

    const { data: supplies } = useQuery(
        trpc.projectSupplies.list.queryOptions(
            queryInput,
            makeOptions(stream === "supplies")
        )
    );
    const { data: labors } = useQuery(
        trpc.projectLabors.list.queryOptions(
            queryInput,
            makeOptions(stream === "labors")
        )
    );
    const { data: misc } = useQuery(
        trpc.projectMisc.list.queryOptions(
            queryInput,
            makeOptions(stream === "misc")
        )
    );
    const { data: payments } = useQuery(
        trpc.projectPayments.list.queryOptions(
            queryInput,
            makeOptions(stream === "payments")
        )
    );

    const dataMap = { supplies, labors, misc, payments };
    return stream ? dataMap[stream]?.items : undefined;
};

const usePendingProjectItemSelection = (
    form: UseFormReturn<SchemaType>,
    projectItems: ReturnType<typeof useProjectItems>,
    open: boolean,
    projectId?: string,
    projectStream?: SchemaType["projectStream"]
) => {
    const pendingItemIdRef = useRef<string | null>(null);

    const handleItemCreated = (itemId: string) => {
        // Store the pending item ID - we'll set it once it appears in the list
        pendingItemIdRef.current = itemId;
    };

    // Watch for when the newly created item appears in the list
    useEffect(() => {
        if (
            pendingItemIdRef.current &&
            projectItems?.some(item => item.id === pendingItemIdRef.current)
        ) {
            form.setValue("projectItemId", pendingItemIdRef.current);
            pendingItemIdRef.current = null;
        }
    }, [projectItems, form]);

    // Clear pending item ID when dialog closes or project/stream changes
    useEffect(() => {
        if (!open) {
            pendingItemIdRef.current = null;
        }
    }, [open]);

    useEffect(() => {
        pendingItemIdRef.current = null;
    }, [projectId, projectStream]);

    return handleItemCreated;
};

type Props = {
    transactionId: string;
    itemId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

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
            description: "",
            amount: 0.0,
            budgetCategory: undefined,
            consolidationGroup: undefined,
            projectId: undefined,
            projectStream: undefined,
            projectItemId: undefined,
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

    const { data: defaults } = useQuery(
        trpc.consolidations.getDefault.queryOptions(
            {
                transactionId,
            },
            {
                enabled: !isUpdate,
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
        queryClient.invalidateQueries(
            trpc.consolidations.getDefault.queryOptions({ transactionId })
        );
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
        if (isUpdate && itemId) {
            updateMutation.mutate({ id: itemId, ...data });
        } else {
            createMutation.mutate({ transactionId, ...data });
        }
    };

    useEffect(() => {
        if (!open) return;

        if (defaults && !isUpdate) {
            console.log({ defaults });
            fillForm(form, {
                ...defaults,
                amount: defaults.remainingAmount / 100,
            });
            form.setFocus("consolidationGroup");
        } else if (data && isUpdate) {
            fillForm(form, {
                ...data,
                amount: data.amount / 100,
                isGst: data.isGst ?? true,
                projectId: data.project?.id,
            });
        }
    }, [open, data, defaults, form, isUpdate]);

    const isPending = createMutation.isPending || updateMutation.isPending;

    // eslint-disable-next-line react-hooks/incompatible-library
    const selectedGroup = form.watch("consolidationGroup");

    const { data: projects } = useQuery(
        trpc.projects.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );

    const projectItems = useProjectItems(form);

    const projectId = form.watch("projectId");
    const projectStream = form.watch("projectStream");

    const createProjectItemRef = useRef<CreateProjectItemHandle>(null);
    const handleItemCreated = usePendingProjectItemSelection(
        form,
        projectItems,
        open,
        projectId,
        projectStream
    );

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
                    <fieldset disabled={!data && !defaults}>
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
                                            <FieldLabel>
                                                {t("amount")}
                                            </FieldLabel>
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
                                                <SelectTrigger ref={field.ref}>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectGroup>
                                                        {transactionConsolidationGroups.map(
                                                            group => {
                                                                return (
                                                                    <SelectItem
                                                                        key={
                                                                            group
                                                                        }
                                                                        value={
                                                                            group
                                                                        }
                                                                    >
                                                                        {t(
                                                                            group
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
                                                    onValueChange={
                                                        field.onChange
                                                    }
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
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
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
                                                    onValueChange={
                                                        field.onChange
                                                    }
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
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        );
                                    }}
                                />
                            )}

                            {/* Project stream */}
                            {selectedGroup === "project" && (
                                <Controller
                                    control={form.control}
                                    name="projectStream"
                                    render={({ field, fieldState }) => {
                                        return (
                                            <Field>
                                                <FieldLabel>
                                                    {t("projectStream")}
                                                </FieldLabel>

                                                <Select
                                                    value={field.value ?? ""}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {projectStreams.map(
                                                                stream => {
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                stream
                                                                            }
                                                                            value={
                                                                                stream
                                                                            }
                                                                        >
                                                                            {t(
                                                                                stream
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
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
                                                    />
                                                )}
                                            </Field>
                                        );
                                    }}
                                />
                            )}

                            {/* Project item */}
                            {selectedGroup === "project" && (
                                <Controller
                                    control={form.control}
                                    name="projectItemId"
                                    render={({ field, fieldState }) => {
                                        const handleValueChange = (
                                            value: string
                                        ) => {
                                            if (value === "__create_new__") {
                                                createProjectItemRef.current?.open();
                                                // Reset the select value
                                                field.onChange("");
                                            } else {
                                                field.onChange(value);
                                            }
                                        };

                                        return (
                                            <Field>
                                                <FieldLabel>
                                                    {t("projectItem")}
                                                </FieldLabel>

                                                <Select
                                                    value={field.value ?? ""}
                                                    onValueChange={
                                                        handleValueChange
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            {projectItems?.map(
                                                                item => {
                                                                    return (
                                                                        <SelectItem
                                                                            key={
                                                                                item.id
                                                                            }
                                                                            value={
                                                                                item.id
                                                                            }
                                                                        >
                                                                            {"name" in
                                                                            item
                                                                                ? item.name
                                                                                : item.date.toDateString()}
                                                                        </SelectItem>
                                                                    );
                                                                }
                                                            )}
                                                            {projectItems &&
                                                                projectItems.length >
                                                                    0 && (
                                                                    <SelectSeparator />
                                                                )}
                                                            {projectStream && (
                                                                <SelectItem value="__create_new__">
                                                                    {tc(
                                                                        "createNew"
                                                                    )}
                                                                </SelectItem>
                                                            )}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>

                                                {fieldState.invalid && (
                                                    <FieldError
                                                        errors={[
                                                            fieldState.error,
                                                        ]}
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
                    </fieldset>
                </form>

                <DialogFooter>
                    <Button
                        disabled={isPending}
                        type="submit"
                        form="consolidate-transaction-form"
                    >
                        {isPending && <Loader2 className="animate-spin" />}
                        <span>{tc("save")}</span>
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* Nested create modal handler */}
            {projectId && (
                <CreateProjectItem
                    ref={createProjectItemRef}
                    projectId={projectId}
                    stream={projectStream}
                    onItemCreated={handleItemCreated}
                />
            )}
        </Dialog>
    );
};
