import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import {
    SearchableSelect,
    SearchableSelectContent,
    SearchableSelectEmpty,
    SearchableSelectGroup,
    SearchableSelectItem,
    SearchableSelectSeparator,
    SearchableSelectTrigger,
    SearchableSelectValue,
} from "@/components/ui/searchable-select";
import {
    projectStreams,
    transactionBudgetCategories,
    transactionConsolidationGroups,
} from "@/lib/constants";
import { Controller, UseFormReturn } from "react-hook-form";
import { createConsolidationSchema } from "../schemas/consolidation.schema";
import { z } from "zod";
import {
    CreateProjectItem,
    CreateProjectItemHandle,
} from "./create-project-item";
import { useProjectItems } from "../hooks/use-project-items";
import { useTranslations } from "next-intl";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { usePendingProjectItemSelection } from "../hooks/use-pending-project-item-selection";
import { usePendingProjectSelection } from "../hooks/use-pending-project-selection";
import { CreateProject } from "@/features/projects/components/create-project";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { CreateLoanPayoff, CreateLoanPayoffHandle } from "./create-loan-payoff";
import { useLoanPayoffs } from "../hooks/use-loan-payoffs";
import { usePendingLoanPayoffSelection } from "../hooks/use-pending-loan-payoff-selection";
import { formatCurrency } from "@/lib/utils";

type SchemaType = z.infer<typeof createConsolidationSchema>;

type FieldProps = {
    control: UseFormReturn<SchemaType>["control"];
};

type DescriptionFieldProps = FieldProps;

export const DescriptionField = ({ control }: DescriptionFieldProps) => {
    const tc = useTranslations("Common");

    return (
        <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => {
                return (
                    <Field>
                        <FieldLabel>{tc("description")}</FieldLabel>
                        <Input {...field} />
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                );
            }}
        />
    );
};

type AmountFieldProps = FieldProps;

export const AmountField = ({ control }: AmountFieldProps) => {
    const t = useTranslations("FinancialAccounts");

    return (
        <Controller
            control={control}
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
                                        ? parseFloat(v.target.value)
                                        : ""
                                )
                            }
                        />
                        {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                );
            }}
        />
    );
};

type ConsolidationGroupFieldProps = FieldProps;

export const ConsolidationGroupField = ({
    control,
    form,
}: ConsolidationGroupFieldProps & { form: UseFormReturn<SchemaType> }) => {
    const t = useTranslations("FinancialAccounts");

    return (
        <Controller
            control={control}
            name="consolidationGroup"
            render={({ field, fieldState }) => {
                return (
                    <Field>
                        <FieldLabel>{t("consolidationGroup")}</FieldLabel>

                        <Select
                            value={field.value ?? ""}
                            onValueChange={value => {
                                field.onChange(value);

                                if (value !== "budget")
                                    form.setValue("budgetCategory", undefined);

                                if (value !== "project") {
                                    form.setValue("projectId", undefined);
                                    form.setValue("projectStream", undefined);
                                    form.setValue("projectItemId", undefined);
                                }

                                if (value !== "loan") {
                                    form.setValue("loanId", undefined);
                                    form.setValue("isPayoff", undefined);
                                    form.setValue("loanPayoffId", undefined);
                                }
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
                                                    key={group}
                                                    value={group}
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
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                );
            }}
        />
    );
};

type BudgetCategoryFieldProps = FieldProps;

export const BudgetCategoryField = ({ control }: BudgetCategoryFieldProps) => {
    const t = useTranslations("FinancialAccounts");

    return (
        <Controller
            control={control}
            name="budgetCategory"
            render={({ field, fieldState }) => {
                return (
                    <Field>
                        <FieldLabel>{t("budgetCategory")}</FieldLabel>

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
                                                    key={category}
                                                    value={category}
                                                >
                                                    {t(category)}
                                                </SelectItem>
                                            );
                                        }
                                    )}
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
    );
};

type ProjectFieldsProps = FieldProps & {
    form: UseFormReturn<SchemaType>;
    createConsolidationOpen: boolean;
};

export type ProjectFieldsHandle = {
    closeAll: () => void;
};

export const ProjectFields = forwardRef<
    ProjectFieldsHandle,
    ProjectFieldsProps
>(({ control, form, createConsolidationOpen }, ref) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    const projectId = form.watch("projectId");
    const projectStream = form.watch("projectStream");

    const trpc = useTRPC();

    const { data: projects } = useQuery(
        trpc.projects.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );
    const projectItems = useProjectItems(form);

    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const createProjectItemRef = useRef<CreateProjectItemHandle>(null);
    const handleItemCreated = usePendingProjectItemSelection(
        form,
        projectItems,
        createConsolidationOpen,
        projectId,
        projectStream
    );
    const handleProjectCreated = usePendingProjectSelection(
        form,
        projects?.items,
        createConsolidationOpen
    );

    useImperativeHandle(ref, () => {
        return {
            closeAll: () => {
                setIsCreateProjectOpen(false);
                createProjectItemRef.current?.close();
            },
        };
    });

    return (
        <>
            <Controller
                control={control}
                name="projectId"
                render={({ field, fieldState }) => {
                    return (
                        <Field>
                            <FieldLabel>{t("project")}</FieldLabel>

                            <SearchableSelect
                                value={field.value ?? ""}
                                onValueChange={value => {
                                    if (value === "__create_new_project__") {
                                        setIsCreateProjectOpen(true);
                                        field.onChange("");
                                        form.setValue(
                                            "projectStream",
                                            undefined
                                        );
                                        form.setValue(
                                            "projectItemId",
                                            undefined
                                        );
                                        return;
                                    }

                                    field.onChange(value);
                                    form.setValue("projectStream", undefined);
                                    form.setValue("projectItemId", undefined);
                                }}
                            >
                                <SearchableSelectTrigger className="w-full">
                                    <SearchableSelectValue
                                        placeholder={t("selectProject")}
                                    />
                                </SearchableSelectTrigger>
                                <SearchableSelectContent
                                    searchPlaceholder={t("searchProject")}
                                >
                                    <SearchableSelectGroup>
                                        <SearchableSelectEmpty>
                                            {t("noProjectsFound")}
                                        </SearchableSelectEmpty>
                                        {projects?.items.map(project => {
                                            return (
                                                <SearchableSelectItem
                                                    key={project.id}
                                                    value={project.id}
                                                >
                                                    {`${project.humanId} - ${project.title}`}
                                                </SearchableSelectItem>
                                            );
                                        })}
                                        {projects &&
                                            projects.items.length > 0 && (
                                                <SearchableSelectSeparator />
                                            )}
                                        <SearchableSelectItem value="__create_new_project__">
                                            {tc("createNew")}
                                        </SearchableSelectItem>
                                    </SearchableSelectGroup>
                                </SearchableSelectContent>
                            </SearchableSelect>

                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    );
                }}
            />

            <Controller
                control={control}
                name="projectStream"
                render={({ field, fieldState }) => {
                    return (
                        <Field>
                            <FieldLabel>{t("projectStream")}</FieldLabel>

                            <Select
                                value={field.value ?? ""}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {projectStreams.map(stream => {
                                            return (
                                                <SelectItem
                                                    key={stream}
                                                    value={stream}
                                                >
                                                    {t(stream)}
                                                </SelectItem>
                                            );
                                        })}
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

            <Controller
                control={control}
                name="projectItemId"
                render={({ field, fieldState }) => {
                    const handleValueChange = (value: string) => {
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
                            <FieldLabel>{t("projectItem")}</FieldLabel>

                            <Select
                                value={field.value ?? ""}
                                onValueChange={handleValueChange}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {projectItems?.map(item => {
                                            return (
                                                <SelectItem
                                                    key={item.id}
                                                    value={item.id}
                                                >
                                                    {"name" in item
                                                        ? item.name
                                                        : item.date.toDateString()}
                                                </SelectItem>
                                            );
                                        })}
                                        {projectItems &&
                                            projectItems.length > 0 && (
                                                <SelectSeparator />
                                            )}
                                        {projectStream && (
                                            <SelectItem value="__create_new__">
                                                {tc("createNew")}
                                            </SelectItem>
                                        )}
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

            {/* Nested create modal handler */}
            {projectId && (
                <CreateProjectItem
                    ref={createProjectItemRef}
                    projectId={projectId}
                    stream={projectStream}
                    onItemCreated={handleItemCreated}
                />
            )}
            <CreateProject
                open={isCreateProjectOpen}
                onOpenChange={setIsCreateProjectOpen}
                itemId={null}
                onCreated={handleProjectCreated}
            />
        </>
    );
});
ProjectFields.displayName = "ProjectFields";

type LoanFieldsProps = FieldProps & {
    form: UseFormReturn<SchemaType>;
    createConsolidationOpen: boolean;
};

export type LoanFieldsHandle = {
    closeAll: () => void;
};

export const LoanFields = forwardRef<
    LoanFieldsHandle,
    LoanFieldsProps
>(({ control, form, createConsolidationOpen }, ref) => {
    const t = useTranslations("FinancialAccounts");
    const tLoans = useTranslations("Loans");
    const tc = useTranslations("Common");

    const loanId = form.watch("loanId");
    const isPayoff = form.watch("isPayoff");

    const trpc = useTRPC();

    const { data: loans } = useQuery(
        trpc.loans.list.queryOptions({
            pagination: { pageSize: -1, pageIndex: 0 },
        })
    );
    const loanPayoffs = useLoanPayoffs(form);

    const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
    const createLoanPayoffRef = useRef<CreateLoanPayoffHandle>(null);
    const handlePayoffCreated = usePendingLoanPayoffSelection(
        form,
        loanPayoffs,
        createConsolidationOpen,
        loanId
    );
    const handleLoanCreated = (loanId: string) => {
        form.setValue("loanId", loanId);
        form.setValue("isPayoff", undefined);
        form.setValue("loanPayoffId", undefined);
    };

    useImperativeHandle(ref, () => {
        return {
            closeAll: () => {
                setIsCreateLoanOpen(false);
                createLoanPayoffRef.current?.close();
            },
        };
    });

    return (
        <>
            <Controller
                control={control}
                name="loanId"
                render={({ field, fieldState }) => {
                    return (
                        <Field>
                            <FieldLabel>{t("loan")}</FieldLabel>

                            <SearchableSelect
                                value={field.value ?? ""}
                                onValueChange={value => {
                                    if (value === "__create_new_loan__") {
                                        setIsCreateLoanOpen(true);
                                        field.onChange("");
                                        form.setValue("isPayoff", undefined);
                                        form.setValue("loanPayoffId", undefined);
                                        return;
                                    }

                                    field.onChange(value);
                                    form.setValue("isPayoff", undefined);
                                    form.setValue("loanPayoffId", undefined);
                                }}
                            >
                                <SearchableSelectTrigger className="w-full">
                                    <SearchableSelectValue
                                        placeholder={t("selectLoan")}
                                    />
                                </SearchableSelectTrigger>
                                <SearchableSelectContent
                                    searchPlaceholder={t("searchLoan")}
                                >
                                    <SearchableSelectGroup>
                                        <SearchableSelectEmpty>
                                            {t("noLoansFound")}
                                        </SearchableSelectEmpty>
                                        {loans?.items.map(loan => {
                                            return (
                                                <SearchableSelectItem
                                                    key={loan.id}
                                                    value={loan.id}
                                                >
                                                    {`${loan.partyName} - ${tLoans(loan.type)}`}
                                                </SearchableSelectItem>
                                            );
                                        })}
                                        {loans &&
                                            loans.items.length > 0 && (
                                                <SearchableSelectSeparator />
                                            )}
                                        <SearchableSelectItem value="__create_new_loan__">
                                            {tc("createNew")}
                                        </SearchableSelectItem>
                                    </SearchableSelectGroup>
                                </SearchableSelectContent>
                            </SearchableSelect>

                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    );
                }}
            />

            <Controller
                control={control}
                name="isPayoff"
                render={({ field, fieldState }) => {
                    return (
                        <Field orientation="horizontal">
                            <Checkbox
                                id="is-payoff-checkbox"
                                checked={field.value ?? false}
                                onCheckedChange={checked => {
                                    field.onChange(checked);
                                    if (!checked) {
                                        form.setValue("loanPayoffId", undefined);
                                    }
                                }}
                            />
                            <FieldLabel htmlFor="is-payoff-checkbox">
                                {t("isPayoff")}
                            </FieldLabel>
                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    );
                }}
            />

            {isPayoff && (
                <Controller
                    control={control}
                    name="loanPayoffId"
                    render={({ field, fieldState }) => {
                        const handleValueChange = (value: string) => {
                            if (value === "__create_new__") {
                                createLoanPayoffRef.current?.open();
                                field.onChange("");
                            } else {
                                field.onChange(value);
                            }
                        };

                        return (
                            <Field>
                                <FieldLabel>{t("loanPayoff")}</FieldLabel>

                                <Select
                                    value={field.value ?? ""}
                                    onValueChange={handleValueChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {loanPayoffs?.map(payoff => {
                                                return (
                                                    <SelectItem
                                                        key={payoff.id}
                                                        value={payoff.id}
                                                    >
                                                        {payoff.date.toDateString()} - {formatCurrency(payoff.amount)}
                                                    </SelectItem>
                                                );
                                            })}
                                            {loanPayoffs &&
                                                loanPayoffs.length > 0 && (
                                                    <SelectSeparator />
                                                )}
                                            {loanId && (
                                                <SelectItem value="__create_new__">
                                                    {tc("createNew")}
                                                </SelectItem>
                                            )}
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
            )}

            {/* Nested create modal handler */}
            {loanId && (
                <CreateLoanPayoff
                    ref={createLoanPayoffRef}
                    loanId={loanId}
                    onPayoffCreated={handlePayoffCreated}
                />
            )}
            <CreateLoan
                open={isCreateLoanOpen}
                onOpenChange={setIsCreateLoanOpen}
                itemId={null}
                onCreated={handleLoanCreated}
            />
        </>
    );
});
LoanFields.displayName = "LoanFields";

type IsGstFieldProps = FieldProps;

export const IsGstField = ({ control }: IsGstFieldProps) => {
    const t = useTranslations("FinancialAccounts");

    return (
        <Controller
            control={control}
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
                            <FieldError errors={[fieldState.error]} />
                        )}
                    </Field>
                );
            }}
        />
    );
};
