import {
  projectStreams,
  transactionBudgetCategories,
  transactionConsolidationGroups,
} from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";
import { createConsolidationSchema } from "../schemas/consolidations.schema";
import { z } from "zod";
import {
  CreateProjectItem,
  CreateProjectItemHandle,
} from "./create-project-item";
import { useProjectItems } from "../hooks/use-project-items";
import { useTranslations } from "next-intl";
import {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { usePendingSelection } from "@/hooks/use-pending-selection";
import { CreateProject } from "@/features/projects/components/create-project";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { CreateLoanPayoff, CreateLoanPayoffHandle } from "./create-loan-payoff";
import { useLoanPayoffs } from "../hooks/use-loan-payoffs";
import { formatCurrency } from "@/lib/utils";
import { TextInput } from "@/components/form/text-input";
import { NumberInput } from "@/components/form/number-input";
import { SelectInput } from "@/components/form/select-input";
import { CheckboxInput } from "@/components/form/checkbox-input";

type SchemaType = z.infer<typeof createConsolidationSchema>;

export type ConsolidationPrefillData = {
  date: Date;
  amount: number;
  description: string;
};

type FieldProps = {
  control: UseFormReturn<SchemaType>["control"];
};

type DescriptionFieldProps = FieldProps;

export const DescriptionField = ({ control }: DescriptionFieldProps) => {
  const tc = useTranslations("Common");

  return (
    <TextInput name="description" label={tc("description")} control={control} />
  );
};

type AmountFieldProps = FieldProps;

export const AmountField = ({ control }: AmountFieldProps) => {
  const t = useTranslations("FinancialAccounts");

  return <NumberInput name="amount" label={t("amount")} control={control} />;
};

type ConsolidationGroupFieldProps = FieldProps;

export const ConsolidationGroupField = ({
  control,
  form,
}: ConsolidationGroupFieldProps & { form: UseFormReturn<SchemaType> }) => {
  const t = useTranslations("FinancialAccounts");

  return (
    <SelectInput
      name="consolidationGroup"
      label={t("consolidationGroup")}
      control={control}
      items={transactionConsolidationGroups.map((group) => ({
        value: group,
        label: t(group),
      }))}
      onChange={(value) => {
        if (value !== "budget") form.setValue("budgetCategory", undefined);

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
    />
  );
};

type BudgetCategoryFieldProps = FieldProps;

export const BudgetCategoryField = ({ control }: BudgetCategoryFieldProps) => {
  const t = useTranslations("FinancialAccounts");

  return (
    <SelectInput
      name="budgetCategory"
      label={t("budgetCategory")}
      control={control}
      items={transactionBudgetCategories.map((category) => ({
        value: category,
        label: t(category),
      }))}
    />
  );
};

type ProjectFieldsProps = FieldProps & {
  form: UseFormReturn<SchemaType>;
  prefillData: ConsolidationPrefillData;
};

export type ProjectFieldsHandle = {
  closeAll: () => void;
};

export const ProjectFields = forwardRef<
  ProjectFieldsHandle,
  ProjectFieldsProps
>(({ control, form, prefillData }, ref) => {
  const t = useTranslations("FinancialAccounts");

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

  const handleItemCreated = usePendingSelection({
    items: projectItems,
    onItemFound: useCallback(
      (id) => form.setValue("projectItemId", id),
      [form]
    ),
    resetDependencies: [projectId, projectStream],
  });

  const handleProjectCreated = usePendingSelection({
    items: projects?.items,
    onItemFound: useCallback(
      (id) => {
        form.setValue("projectId", id);
        form.setValue("projectStream", undefined);
        form.setValue("projectItemId", undefined);
      },
      [form]
    ),
    resetDependencies: [projectStream],
  });

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
      <SelectInput
        name="projectId"
        label={t("project")}
        control={control}
        items={
          projects?.items.map((project) => ({
            value: project.id,
            label: `${project.humanId} - ${project.title}`,
          })) ?? []
        }
        isSearchable
        onCreate={() => {
          setIsCreateProjectOpen(true);
          form.setValue("projectStream", undefined);
          form.setValue("projectItemId", undefined);
        }}
        onChange={() => {
          form.setValue("projectStream", undefined);
          form.setValue("projectItemId", undefined);
        }}
      />

      <SelectInput
        name="projectStream"
        label={t("projectStream")}
        control={control}
        items={projectStreams.map((stream) => ({
          value: stream,
          label: t(stream),
        }))}
      />

      <SelectInput
        name="projectItemId"
        label={t("projectItem")}
        control={control}
        items={
          projectItems?.map((item) => ({
            value: item.id,
            label:
              ("name" in item
                ? `${item.name} - ${formatCurrency("amount" in item ? item.amount : "quantity" in item ? item.quantity * item.unitPrice : item.hours * item.rate)}`
                : `${item.date.toDateString()} - (${formatCurrency(
                    item.amount
                  )})`) +
              ` - ${item.isConsolidated ? "consolidated" : "not consolidated"}`,
          })) ?? []
        }
        onCreate={() => createProjectItemRef.current?.open()}
      />

      {/* Nested create modal handler */}
      {projectId && (
        <CreateProjectItem
          ref={createProjectItemRef}
          projectId={projectId}
          stream={projectStream}
          onItemCreated={handleItemCreated}
          prefillData={prefillData}
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
  prefillData: ConsolidationPrefillData;
};

export type LoanFieldsHandle = {
  closeAll: () => void;
};

export const LoanFields = forwardRef<LoanFieldsHandle, LoanFieldsProps>(
  ({ control, form, prefillData }, ref) => {
    const t = useTranslations("FinancialAccounts");
    const tLoans = useTranslations("Loans");

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
    const handlePayoffCreated = usePendingSelection({
      items: loanPayoffs,
      onItemFound: useCallback(
        (id) => form.setValue("loanPayoffId", id),
        [form]
      ),
      resetDependencies: [loanId],
    });
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
        <SelectInput
          name="loanId"
          label={t("loan")}
          control={control}
          items={
            loans?.items.map((loan) => ({
              value: loan.id,
              label: `${loan.partyName} - ${tLoans(loan.type)} (${formatCurrency(
                loan.amount
              )})`,
            })) ?? []
          }
          isSearchable
          onCreate={() => {
            setIsCreateLoanOpen(true);
            form.setValue("isPayoff", undefined);
            form.setValue("loanPayoffId", undefined);
          }}
          onChange={() => {
            form.setValue("isPayoff", undefined);
            form.setValue("loanPayoffId", undefined);
          }}
        />

        <CheckboxInput
          name="isPayoff"
          label={t("isPayoff")}
          control={control}
          onChange={(checked) => {
            if (!checked) {
              form.setValue("loanPayoffId", undefined);
            }
          }}
        />

        {isPayoff && (
          <SelectInput
            name="loanPayoffId"
            label={t("loanPayoff")}
            control={control}
            items={
              loanPayoffs?.map((payoff) => ({
                value: payoff.id,
                label: `${payoff.date.toDateString()} - ${formatCurrency(
                  payoff.amount
                )}`,
              })) ?? []
            }
            isSearchable
            onCreate={() => createLoanPayoffRef.current?.open()}
          />
        )}

        {/* Nested create modal handler */}
        {loanId && (
          <CreateLoanPayoff
            ref={createLoanPayoffRef}
            loanId={loanId}
            onPayoffCreated={handlePayoffCreated}
            prefillData={prefillData}
          />
        )}
        <CreateLoan
          open={isCreateLoanOpen}
          onOpenChange={setIsCreateLoanOpen}
          itemId={null}
          onCreated={handleLoanCreated}
          prefillData={{
            date: prefillData.date,
            amount: prefillData.amount,
            notes: prefillData.description,
          }}
        />
      </>
    );
  }
);
LoanFields.displayName = "LoanFields";

type IsGstFieldProps = FieldProps;

export const IsGstField = ({ control }: IsGstFieldProps) => {
  const t = useTranslations("FinancialAccounts");

  return <CheckboxInput name="isGst" label={t("isGst")} control={control} />;
};
