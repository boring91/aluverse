import {
  projectStreams,
  transactionReconciliationGroups,
} from "@/lib/constants";
import { CreateProjectItem } from "./create-project-item";
import type { CreateProjectItemHandle } from "./create-project-item";
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
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { CreateLoanPayoff } from "./create-loan-payoff";
import type { CreateLoanPayoffHandle } from "./create-loan-payoff";
import { useLoanPayoffs } from "../hooks/use-loan-payoffs";
import { useGstPayments } from "../hooks/use-gst-payments";
import { formatCurrency } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/date";
import { useStore } from "@tanstack/react-form";
import type { useReconciliationForm } from "../hooks/use-reconciliation-form";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { CreateGstPayment } from "./create-gst-payment";
import type { CreateGstPaymentHandle } from "./create-gst-payment";

type FormApi = ReturnType<typeof useReconciliationForm>["form"];

export type ReconciliationPrefillData = {
  date: string;
  amount: number;
  description: string;
};

const GROUP_LABELS: Record<
  (typeof transactionReconciliationGroups)[number],
  string
> = {
  budget: "Budget",
  project: "Project",
  loan: "Loan",
  gst_payable: "GST Payable",
  tax: "Tax",
  refund: "Refund",
  refunded: "Refunded",
  unclassified: "Unclassified",
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
      children={(field) => <field.TextField label="Description" />}
    />
  );
}

export function AmountField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="amount"
      children={(field) => <field.NumberField label="Amount" />}
    />
  );
}

export function ReconciliationGroupField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="reconciliationGroup"
      children={(field) => (
        <field.SelectField
          label="Reconciliation group"
          items={transactionReconciliationGroups
            .map((group) => ({
              value: group,
              label: GROUP_LABELS[group],
            }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          onChange={(value) => {
            if (value !== "budget") form.resetField("budgetCategoryId");

            if (value !== "project") {
              form.resetField("projectId");
              form.resetField("projectStream");
              form.resetField("projectItemId");
            }

            if (value !== "loan") {
              form.resetField("loanId");
              form.resetField("isPayoff");
              form.resetField("loanPayoffId");
            }

            if (value !== "gst_payable") {
              form.resetField("gstPaymentId");
            }
          }}
        />
      )}
    />
  );
}

export function BudgetCategoryField({ form }: { form: FormApi }) {
  const trpc = useTRPC();
  const { hasPermission } = useRbacAccess();
  const canReadBudgetCategories = hasPermission("budgetCategories.read");

  const { data } = useQuery(
    trpc.budgetCategories.list.queryOptions(
      {
        pagination: { pageSize: -1, pageIndex: 0 },
      },
      { enabled: canReadBudgetCategories },
    ),
  );

  return (
    <form.AppField
      name="budgetCategoryId"
      children={(field) => (
        <field.SelectField
          label="Budget category"
          items={
            data?.items.map((category) => ({
              value: category.id,
              label: category.name,
            })) ?? []
          }
        />
      )}
    />
  );
}

type ProjectFieldsProps = {
  form: FormApi;
  prefillData: ReconciliationPrefillData;
};

export type ProjectFieldsHandle = {
  closeAll: () => void;
};

export const ProjectFields = forwardRef<
  ProjectFieldsHandle,
  ProjectFieldsProps
>(({ form, prefillData }, ref) => {
  const projectId = useStore(form.store, (state) => state.values.projectId);
  const projectStream = useStore(
    form.store,
    (state) => state.values.projectStream,
  );
  const { hasPermission } = useRbacAccess();

  const canReadProjects = hasPermission("projects.read");
  const canCreateProjects = hasPermission("projects.create");
  const canReadProjectItems = hasPermission("projectItems.read");
  const canCreateProjectItems = hasPermission("projectItems.create");

  const trpc = useTRPC();

  const { data: projects } = useQuery(
    trpc.projects.list.queryOptions(
      {
        pagination: { pageSize: -1, pageIndex: 0 },
      },
      {
        enabled: canReadProjects,
      },
    ),
  );

  const projectItems = useProjectItems(
    projectId,
    projectStream,
    canReadProjectItems,
  );

  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const createProjectItemRef = useRef<CreateProjectItemHandle>(null);

  const handlePendingItemCreated = usePendingSelection({
    items: projectItems,
    onItemFound: useCallback(
      (id) => {
        form.setFieldValue("projectItemId", id);
      },
      [form],
    ),
    resetDependencies: [projectId, projectStream],
  });

  const handlePendingProjectCreated = usePendingSelection({
    items: projects?.items,
    onItemFound: useCallback(
      (id) => {
        form.setFieldValue("projectId", id);
        form.resetField("projectStream");
        form.resetField("projectItemId");
      },
      [form],
    ),
    resetDependencies: [projectStream],
  });

  const handleItemCreated = useCallback(
    (id: string) => {
      handlePendingItemCreated(id);
    },
    [handlePendingItemCreated],
  );

  const handleProjectCreated = useCallback(
    (id: string) => {
      form.resetField("projectStream");
      form.resetField("projectItemId");
      handlePendingProjectCreated(id);
    },
    [form, handlePendingProjectCreated],
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
      <form.AppField
        name="projectId"
        children={(field) => (
          <field.SelectField
            label="Project"
            items={
              projects?.items.map((project) => ({
                value: project.id,
                label: `${project.humanId} - ${project.client}`,
              })) ?? []
            }
            isSearchable
            onCreate={
              canCreateProjects
                ? () => {
                    setIsCreateProjectOpen(true);
                    form.resetField("projectStream");
                    form.resetField("projectItemId");
                  }
                : undefined
            }
            onChange={() => {
              form.resetField("projectStream");
              form.resetField("projectItemId");
            }}
          />
        )}
      />

      <form.AppField
        name="projectStream"
        children={(field) => (
          <field.SelectField
            label="Project stream"
            items={projectStreams.map((stream) => ({
              value: stream,
              label: STREAM_LABELS[stream],
            }))}
            onChange={() => {
              form.resetField("projectItemId");
            }}
          />
        )}
      />

      <form.AppField
        name="projectItemId"
        children={(field) => (
          <field.SelectField
            label="Project item"
            items={
              projectItems?.map((item) => ({
                value: item.id,
                label:
                  ("name" in item
                    ? `${item.name} - ${formatCurrency("amount" in item ? item.amount : "quantity" in item ? item.quantity * item.unitPrice : item.hours * item.rate)}`
                    : `${formatCalendarDate(item.date)} - (${formatCurrency(item.amount)})`) +
                  ` - ${item.isReconciled ? "Reconciled" : "Not reconciled"}`,
              })) ?? []
            }
            onCreate={
              canCreateProjectItems
                ? () => {
                    form.resetField("projectItemId");
                    createProjectItemRef.current?.open();
                  }
                : undefined
            }
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
          canCreate={canCreateProjectItems}
        />
      )}
      {canCreateProjects ? (
        <CreateProject
          open={isCreateProjectOpen}
          onOpenChange={setIsCreateProjectOpen}
          itemId={null}
          onCreated={handleProjectCreated}
        />
      ) : null}
    </>
  );
});
ProjectFields.displayName = "ProjectFields";

type LoanFieldsProps = {
  form: FormApi;
  prefillData: ReconciliationPrefillData;
};

export type LoanFieldsHandle = {
  closeAll: () => void;
};

export const LoanFields = forwardRef<LoanFieldsHandle, LoanFieldsProps>(
  ({ form, prefillData }, ref) => {
    const loanId = useStore(form.store, (state) => state.values.loanId);
    const isPayoff = useStore(form.store, (state) => state.values.isPayoff);
    const { hasPermission } = useRbacAccess();

    const canReadLoans = hasPermission("loans.read");
    const canCreateLoans = hasPermission("loans.create");
    const canReadLoanPayoffs = hasPermission("loanPayoffs.read");
    const canCreateLoanPayoffs = hasPermission("loanPayoffs.create");

    const trpc = useTRPC();

    const { data: loans } = useQuery(
      trpc.loans.list.queryOptions(
        {
          pagination: { pageSize: -1, pageIndex: 0 },
        },
        {
          enabled: canReadLoans,
        },
      ),
    );
    const loanPayoffs = useLoanPayoffs(loanId, canReadLoanPayoffs);

    const [isCreateLoanOpen, setIsCreateLoanOpen] = useState(false);
    const createLoanPayoffRef = useRef<CreateLoanPayoffHandle>(null);
    const handlePendingPayoffCreated = usePendingSelection({
      items: loanPayoffs,
      onItemFound: useCallback(
        (id) => {
          form.setFieldValue("loanPayoffId", id);
        },
        [form],
      ),
      resetDependencies: [loanId],
    });
    const handlePayoffCreated = useCallback(
      (id: string) => {
        handlePendingPayoffCreated(id);
      },
      [handlePendingPayoffCreated],
    );
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
          children={(field) => (
            <field.SelectField
              label="Loan"
              items={
                loans?.items.map((loan) => ({
                  value: loan.id,
                  label: `${loan.partyName} - ${loan.type === "lent" ? "Lent" : "Borrowed"} (${formatCurrency(loan.amount)})`,
                })) ?? []
              }
              isSearchable
              onCreate={
                canCreateLoans
                  ? () => {
                      setIsCreateLoanOpen(true);
                      form.resetField("isPayoff");
                      form.resetField("loanPayoffId");
                    }
                  : undefined
              }
              onChange={() => {
                form.resetField("isPayoff");
                form.resetField("loanPayoffId");
              }}
            />
          )}
        />

        <form.AppField
          name="isPayoff"
          children={(field) => (
            <field.CheckboxField
              label="Is payoff"
              onChange={(checked) => {
                if (checked !== true) {
                  form.resetField("loanPayoffId");
                }
              }}
            />
          )}
        />

        {isPayoff && (
          <form.AppField
            name="loanPayoffId"
            children={(field) => (
              <field.SelectField
                label="Loan payoff"
                items={
                  loanPayoffs?.map((payoff) => ({
                    value: payoff.id,
                    label: `${formatCalendarDate(payoff.date)} - ${formatCurrency(payoff.amount)}`,
                  })) ?? []
                }
                isSearchable
                onCreate={
                  canCreateLoanPayoffs
                    ? () => createLoanPayoffRef.current?.open()
                    : undefined
                }
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
            canCreate={canCreateLoanPayoffs}
          />
        )}
        {canCreateLoans ? (
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
        ) : null}
      </>
    );
  },
);
LoanFields.displayName = "LoanFields";

type GstPaymentFieldsProps = {
  form: FormApi;
  prefillData: ReconciliationPrefillData;
};

export type GstPaymentFieldsHandle = {
  closeAll: () => void;
};

export const GstPaymentFields = forwardRef<
  GstPaymentFieldsHandle,
  GstPaymentFieldsProps
>(({ form, prefillData }, ref) => {
  const { hasPermission } = useRbacAccess();
  const canReadGstPayments = hasPermission("gst.read");
  const canCreateGstPayments = hasPermission("gst.create");

  const gstPayments = useGstPayments(canReadGstPayments);
  const createGstPaymentRef = useRef<CreateGstPaymentHandle>(null);

  const handlePendingGstPaymentCreated = usePendingSelection({
    items: gstPayments,
    onItemFound: useCallback(
      (id) => {
        form.setFieldValue("gstPaymentId", id);
      },
      [form],
    ),
    resetDependencies: [],
  });

  const handleGstPaymentCreated = useCallback(
    (id: string) => {
      handlePendingGstPaymentCreated(id);
    },
    [handlePendingGstPaymentCreated],
  );

  useImperativeHandle(ref, () => {
    return {
      closeAll: () => {
        createGstPaymentRef.current?.close();
      },
    };
  });

  return (
    <>
      <form.AppField
        name="gstPaymentId"
        children={(field) => (
          <field.SelectField
            label="GST payment"
            items={
              gstPayments?.map((item) => ({
                value: item.id,
                label:
                  `${formatCalendarDate(item.periodFrom)} - ${formatCalendarDate(item.periodTo)} (${formatCurrency(item.amount)})` +
                  ` - ${item.isReconciled ? "Reconciled" : "Not reconciled"}`,
              })) ?? []
            }
            isSearchable
            onCreate={
              canCreateGstPayments
                ? () => {
                    form.resetField("gstPaymentId");
                    createGstPaymentRef.current?.open();
                  }
                : undefined
            }
          />
        )}
      />

      {canCreateGstPayments ? (
        <CreateGstPayment
          ref={createGstPaymentRef}
          onPaymentCreated={handleGstPaymentCreated}
          prefillData={{
            amount: prefillData.amount,
          }}
          canCreate={canCreateGstPayments}
        />
      ) : null}
    </>
  );
});
GstPaymentFields.displayName = "GstPaymentFields";

export function IsGstField({ form }: { form: FormApi }) {
  return (
    <form.AppField
      name="isGst"
      children={(field) => <field.CheckboxField label="Is GST" />}
    />
  );
}
