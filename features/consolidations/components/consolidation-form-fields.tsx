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
import { CreateProjectItemHandle } from "./create-project-item";
import { useProjectItems } from "../hooks/use-project-items";
import { useTranslations } from "next-intl";

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

                                if (value !== "project")
                                    form.setValue("projectId", undefined);
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
    selectedGroup: SchemaType["consolidationGroup"];
    projects: { id: string; humanId: string; title: string }[] | undefined;
    projectItems: ReturnType<typeof useProjectItems>;
    projectStream?: SchemaType["projectStream"];
    isCreateProjectOpen: boolean;
    setIsCreateProjectOpen: (open: boolean) => void;
    createProjectItemRef: React.RefObject<CreateProjectItemHandle | null>;
    form: UseFormReturn<SchemaType>;
};

export const ProjectFields = ({
    control,
    form,
    selectedGroup,
    projects,
    projectItems,
    projectStream,
    isCreateProjectOpen,
    setIsCreateProjectOpen,
    createProjectItemRef,
}: ProjectFieldsProps) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    if (selectedGroup !== "project") return null;

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
                                        {projects?.map(project => {
                                            return (
                                                <SearchableSelectItem
                                                    key={project.id}
                                                    value={project.id}
                                                >
                                                    {`${project.humanId} - ${project.title}`}
                                                </SearchableSelectItem>
                                            );
                                        })}
                                        {projects && projects.length > 0 && (
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
        </>
    );
};

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
