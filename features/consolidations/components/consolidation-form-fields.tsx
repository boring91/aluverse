/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  projectStreams,
  transactionBudgetCategories,
  transactionConsolidationGroups,
} from "@/lib/constants";
import {
  CreateProjectItem,
  CreateProjectItemHandle,
} from "./create-project-item";
import { useProjectItems } from "../hooks/use-project-items";
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
import { useStore } from "@tanstack/react-form";

type FormApi = any;

export type ConsolidationPrefillData = {
  date: Date;
  amount: number;
  description: string;
};

const GROUP_LABELS: Record<
  (typeof transactionConsolidationGroups)[number],
  string
> = {
  budget: "Budget",
  project: "Project",
  loan: "Loan",
  tax: "Tax",
  refund: "Refund",
  refunded: "Refunded",
  unclassified: "Unclassified",
};

const CATEGORY_LABELS: Record<
  (typeof transactionBudgetCategories)[number],
  string
> = {
  subscription: "Subscription",
  consumable: "Consumable",
  toll: "Toll",
  tool: "Tool",
  food: "Food",
  salary: "Salary",
  fuel: "Fuel",
};

const STREAM_LABELS: Record<(typeof projectStreams)[number], string> = {
  supplies: "Supplies",
  labors: "Labors",
  misc: "Misc",
  payments: "Payments",
};

export function DescriptionField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="description"
      children={(field: any) => <field.TextField label="Description" />}
    />
  );
}

export function AmountField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="amount"
      children={(field: any) => <field.NumberField label="Amount" />}
    />
  );
}

export function ConsolidationGroupField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="consolidationGroup"
      children={(field: any) => (
        <field.SelectField
          label="Consolidation group"
          items={transactionConsolidationGroups
            .map((group) => ({
              value: group,
              label: GROUP_LABELS[group],
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          onChange={(value: string) => {
            if (value !== "budget")
              form.setFieldValue("budgetCategory", undefined);

            if (value !== "project") {
              form.setFieldValue("projectId", undefined);
              form.setFieldValue("projectStream", undefined);
              form.setFieldValue("projectItemId", undefined);
            }

            if (value !== "loan") {
              form.setFieldValue("loanId", undefined);
              form.setFieldValue("isPayoff", undefined);
              form.setFieldValue("loanPayoffId", undefined);
            }
          }}
        />
      )}
    />
  );
}

export function BudgetCategoryField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="budgetCategory"
      children={(field: any) => (
        <field.SelectField
          label="Budget category"
          items={transactionBudgetCategories.map((category) => ({
            value: category,
            label: CATEGORY_LABELS[category],
          }))}
        />
      )}
    />
  );
}

type ProjectFieldsProps = {
  form: FormApi;
  prefillData: ConsolidationPrefillData;
};

export type ProjectFieldsHandle = {
  closeAll: () => void;
};

export const ProjectFields = forwardRef<
  ProjectFieldsHandle,
  ProjectFieldsProps
>(({ form, prefillData }, ref) => {
  const projectId = useStore(
    form.store,
    (state: any) => state.values.projectId
  );
  const projectStream = useStore(
    form.store,
    (state: any) => state.values.projectStream
  );

  const trpc = useTRPC();

  const { data: projects } = useQuery(
    trpc.projects.list.queryOptions({
      pagination: { pageSize: -1, pageIndex: 0 },
    })
  );

  const projectItems = useProjectItems(projectId, projectStream);

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const createProjectItemRef = useRef<CreateProjectItemHandle>(null);

  const handleItemCreated = usePendingSelection({
    items: projectItems,
    onItemFound: useCallback(
      (id) => {
        form.setFieldValue("projectItemId", id);
      },
      [form]
    ),
    resetDependencies: [projectId, projectStream],
  });

  const handleProjectCreated = usePendingSelection({
    items: projects?.items,
    onItemFound: useCallback(
      (id) => {
        form.setFieldValue("projectId", id);
        form.resetField("projectStream");
        form.resetField("projectItemId");
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
      <form.AppField
        name="projectId"
        children={(field: any) => (
          <field.SelectField
            label="Project"
            items={
              projects?.items.map((project) => ({
                value: project.id,
                label: `${project.humanId} - ${project.client}`,
              })) ?? []
            }
            isSearchable
            onCreate={() => {
              setIsCreateProjectOpen(true);
              form.resetField("projectStream");
              form.resetField("projectItemId");
            }}
            onChange={() => {
              form.resetField("projectStream");
              form.resetField("projectItemId");
            }}
          />
        )}
      />

      <form.AppField
        name="projectStream"
        children={(field: any) => (
          <field.SelectField
            label="Project stream"
            items={projectStreams.map((stream) => ({
              value: stream,
              label: STREAM_LABELS[stream],
            }))}
          />
        )}
      />

      <form.AppField
        name="projectItemId"
        children={(field: any) => (
          <field.SelectField
            label="Project item"
            items={
              projectItems?.map((item: any) => ({
                value: item.id,
                label:
                  ("name" in item
                    ? `${item.name} - ${formatCurrency("amount" in item ? item.amount : "quantity" in item ? item.quantity * item.unitPrice : item.hours * item.rate)}`
                    : `${item.date.toDateString()} - (${formatCurrency(item.amount)})`) +
                  ` - ${item.isConsolidated ? "Consolidated" : "Not consolidated"}`,
              })) ?? []
            }
            onCreate={() => createProjectItemRef.current?.open()}
          />
        )}
      />

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

type LoanFieldsProps = {
  form: FormApi;
  prefillData: ConsolidationPrefillData;
};

export type LoanFieldsHandle = {
  closeAll: () => void;
};

export const LoanFields = forwardRef<LoanFieldsHandle, LoanFieldsProps>(
  ({ form, prefillData }, ref) => {
    const loanId = useStore(form.store, (state: any) => state.values.loanId);
    const isPayoff = useStore(
      form.store,
      (state: any) => state.values.isPayoff
    );

    const trpc = useTRPC();

    const { data: loans } = useQuery(
      trpc.loans.list.queryOptions({
        pagination: { pageSize: -1, pageIndex: 0 },
      })
    );
    const loanPayoffs = useLoanPayoffs(loanId);

    const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
    const createLoanPayoffRef = useRef<CreateLoanPayoffHandle>(null);
    const handlePayoffCreated = usePendingSelection({
      items: loanPayoffs,
      onItemFound: useCallback(
        (id) => {
          form.setFieldValue("loanPayoffId", id);
        },
        [form]
      ),
      resetDependencies: [loanId],
    });
    const handleLoanCreated = (createdLoanId: string) => {
      form.setFieldValue("loanId", createdLoanId);
      form.resetField("isPayoff");
      form.resetField("loanPayoffId");
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
        <form.AppField
          name="loanId"
          children={(field: any) => (
            <field.SelectField
              label="Loan"
              items={
                loans?.items.map((loan) => ({
                  value: loan.id,
                  label: `${loan.partyName} - ${loan.type === "lent" ? "Lent" : "Borrowed"} (${formatCurrency(loan.amount)})`,
                })) ?? []
              }
              isSearchable
              onCreate={() => {
                setIsCreateLoanOpen(true);
                form.resetField("isPayoff");
                form.resetField("loanPayoffId");
              }}
              onChange={() => {
                form.resetField("isPayoff");
                form.resetField("loanPayoffId");
              }}
            />
          )}
        />

        <form.AppField
          name="isPayoff"
          children={(field: any) => (
            <field.CheckboxField
              label="Is payoff"
              onChange={(checked: any) => {
                if (!checked) {
                  form.resetField("loanPayoffId");
                }
              }}
            />
          )}
        />

        {isPayoff && (
          <form.AppField
            name="loanPayoffId"
            children={(field: any) => (
              <field.SelectField
                label="Loan payoff"
                items={
                  loanPayoffs?.map((payoff) => ({
                    value: payoff.id,
                    label: `${payoff.date.toDateString()} - ${formatCurrency(payoff.amount)}`,
                  })) ?? []
                }
                isSearchable
                onCreate={() => createLoanPayoffRef.current?.open()}
              />
            )}
          />
        )}

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

export function IsGstField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="isGst"
      children={(field: any) => <field.CheckboxField label="Is GST" />}
    />
  );
}
