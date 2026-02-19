import { useTRPC } from "@/trpc/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreateTransaction } from "./create-transaction";
import {
  DataTable,
  DataTableFilters,
  BooleanFilter,
  useDataTable,
  useDataTableFilters,
  StringFilter,
  DateFilter,
  EnumFilter,
} from "@/components/data-table";
import { useConfirm } from "@/lib/confirm-context";
import { parseAsString, useQueryState } from "nuqs";
import { useTransactionsColumns } from "../hooks/use-transactions-columns";
import { ReconciliationsList } from "@/features/reconciliations/components/reconciliations-list";
import { transactionFiltersSchema } from "../schemas/transactions.shared-schema";
import { NumberFilter } from "@/components/data-table/filters/number-filter";
import { transactionReconciliationGroups } from "@/lib/constants";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

type Props = {
  mode: "account" | "reconciliation";
  accountId?: string;
};

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

const RECONCILIATION_GROUP_LABELS: Record<
  (typeof transactionReconciliationGroups)[number],
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

export const TransactionsList = ({ mode = "account", accountId }: Props) => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("transactions.read");
  const canCreate = hasPermission("transactions.create");
  const canUpdate = hasPermission("transactions.update");
  const canDelete = hasPermission("transactions.delete");
  const canReadProjects = hasPermission("projects.read");
  const canReadBudgetCategories = hasPermission("budgetCategories.read");
  const canManageReconciliations =
    hasPermission("reconciliations.read") ||
    hasPermission("reconciliations.create") ||
    hasPermission("reconciliations.update") ||
    hasPermission("reconciliations.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);
  const [reconcileId, setReconcileId] = useQueryState(
    "reconcileId",
    parseAsString
  );
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );
  const [
    selectedReconciliationTransaction,
    setSelectedReconciliationTransaction,
  ] = useState<Transaction | null>(null);

  const handleDelete = (itemId: string) => {
    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(itemId)));
        deleteMutation.mutate({ id: itemId });
      },
    });
  };

  const { setOpenCreateSheet, ...dataTable } = useDataTable();

  const { filter, reset, isActive, raw } = useDataTableFilters(
    transactionFiltersSchema
  );

  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.transactions.list.queryOptions(
      {
        accountId,
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
        filters: {
          ...raw,
          budgetCategoryId:
            typeof raw.budgetCategoryId === "string"
              ? raw.budgetCategoryId
              : undefined,
          fromAmount:
            raw.fromAmount === undefined ? undefined : raw.fromAmount * 100,
          toAmount: raw.toAmount === undefined ? undefined : raw.toAmount * 100,
        },
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      }
    )
  );

  const deleteMutation = useMutation(
    trpc.transactions.delete.mutationOptions({
      onSuccess: (data) => {
        const transaction = data;
        queryClient.invalidateQueries(
          trpc.transactions.list.queryOptions({ accountId })
        );
        queryClient.invalidateQueries(
          trpc.transactions.get.queryOptions({ id: transaction.id })
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.list.queryOptions()
        );
        queryClient.invalidateQueries(
          trpc.financialAccounts.get.queryOptions({
            id: transaction.account.id,
          })
        );
        setCurrentlyProcessing((set) => {
          set.delete(transaction.id);
          return new Set(set);
        });
        toast.success("Deleted successfully");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const columns = useTransactionsColumns(
    canUpdate ? setItemId : undefined,
    canDelete ? handleDelete : undefined,
    canManageReconciliations ? setReconcileId : undefined,
    currentlyProcessing,
    mode === "reconciliation"
  );

  const { data: projects } = useQuery(
    trpc.projects.list.queryOptions(
      {},
      {
        enabled: canReadProjects && mode === "reconciliation",
      }
    )
  );

  const { data: budgetCategories } = useQuery(
    trpc.budgetCategories.list.queryOptions(
      {
        pagination: { pageSize: -1, pageIndex: 0 },
      },
      {
        enabled: canReadBudgetCategories && mode === "reconciliation",
      }
    )
  );
  const resolvedReconciliationTransaction =
    mode === "reconciliation" && reconcileId
      ? (data?.items.find((item) => item.id === reconcileId) ?? null)
      : null;
  const reconciliationTransaction =
    resolvedReconciliationTransaction ?? selectedReconciliationTransaction;

  if (isPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to transactions.
      </p>
    );
  }

  return (
    <>
      {accountId && mode === "account" && (
        <CreateTransaction
          accountId={accountId}
          open={
            (canCreate && dataTable.openCreateSheet && !itemId) ||
            (canUpdate && !!itemId)
          }
          onOpenChange={(value) => {
            if (value) {
              if (!itemId && !canCreate) {
                return;
              }
              if (itemId && !canUpdate) {
                return;
              }
              setOpenCreateSheet(true);
              return;
            }

            setItemId(null);
            setOpenCreateSheet(false);
          }}
          itemId={itemId}
        />
      )}

      {mode === "reconciliation" &&
      canManageReconciliations &&
      reconciliationTransaction ? (
        <ReconciliationsList
          transaction={reconciliationTransaction}
          open={!!reconcileId && reconciliationTransaction.id === reconcileId}
          onOpenChange={(open) => {
            if (!open) {
              if (resolvedReconciliationTransaction) {
                setSelectedReconciliationTransaction(
                  resolvedReconciliationTransaction
                );
              }
              setReconcileId(null);
            }
          }}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={data}
        {...dataTable}
        setOpenCreateSheet={
          mode === "account" && canCreate ? setOpenCreateSheet : undefined
        }
        columnVisibility={{
          actions: mode === "account" && (canUpdate || canDelete),
          reconciliationActions:
            mode === "reconciliation" && canManageReconciliations,
          isReconciled: mode === "reconciliation",
          reconciliationGroup: mode === "reconciliation",
        }}
        filtersSlot={
          <DataTableFilters onReset={reset} hasActiveFilters={isActive}>
            <StringFilter label="Keyword" control={filter.keyword} />

            <DateFilter label="From date" control={filter.from} />

            <DateFilter label="To date" control={filter.to} />

            <NumberFilter label="From amount" control={filter.fromAmount} />

            <NumberFilter label="To amount" control={filter.toAmount} />

            {mode === "reconciliation" && (
              <>
                <BooleanFilter
                  label="Reconciled"
                  control={filter.isReconciled}
                  trueLabel="Reconciled"
                  falseLabel="Not reconciled"
                />

                <BooleanFilter
                  label="Has GST"
                  control={filter.hasGst}
                  trueLabel="with GST"
                  falseLabel="Without GST"
                />

                <EnumFilter
                  label="Reconciliation group"
                  control={filter.reconciliationGroup}
                  options={transactionReconciliationGroups.map((group) => ({
                    value: group,
                    label: RECONCILIATION_GROUP_LABELS[group],
                  }))}
                />

                {canReadBudgetCategories ? (
                  <EnumFilter
                    label="Budget Category"
                    control={filter.budgetCategoryId}
                    options={
                      budgetCategories?.items.map((category) => ({
                        value: category.id,
                        label: `${category.name} (${category.humanId})`,
                      })) ?? []
                    }
                  />
                ) : null}

                <EnumFilter
                  label="Project"
                  control={filter.projectId}
                  options={
                    projects?.items.map((project) => ({
                      value: project.id,
                      label: project.humanId,
                    })) ?? []
                  }
                />
              </>
            )}
          </DataTableFilters>
        }
      />
    </>
  );
};
