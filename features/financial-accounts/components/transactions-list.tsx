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
import { ConsolidationsList } from "@/features/consolidations/components/consolidations-list";
import { transactionFiltersSchema } from "../schemas/transactions.shared-schema";
import { NumberFilter } from "@/components/data-table/filters/number-filter";
import {
  transactionBudgetCategories,
  transactionConsolidationGroups,
} from "@/lib/constants";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

type Props = {
  mode: "account" | "consolidation";
  accountId?: string;
};

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

const CONSOLIDATION_GROUP_LABELS: Record<
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

const BUDGET_CATEGORY_LABELS: Record<
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

export const TransactionsList = ({ mode = "account", accountId }: Props) => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("transactions.read");
  const canCreate = hasPermission("transactions.create");
  const canUpdate = hasPermission("transactions.update");
  const canDelete = hasPermission("transactions.delete");
  const canReadProjects = hasPermission("projects.read");
  const canManageConsolidations =
    hasPermission("consolidations.read") ||
    hasPermission("consolidations.create") ||
    hasPermission("consolidations.update") ||
    hasPermission("consolidations.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);
  const [consolidateId, setConsolidateId] = useQueryState(
    "consolidateId",
    parseAsString
  );
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );
  const [
    selectedConsolidationTransaction,
    setSelectedConsolidationTransaction,
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
    canManageConsolidations ? setConsolidateId : undefined,
    currentlyProcessing,
    mode === "consolidation"
  );

  const { data: projects } = useQuery(
    trpc.projects.list.queryOptions(
      {},
      {
        enabled: canReadProjects && mode === "consolidation",
      }
    )
  );
  const resolvedConsolidationTransaction =
    mode === "consolidation" && consolidateId
      ? (data?.items.find((item) => item.id === consolidateId) ?? null)
      : null;
  const consolidationTransaction =
    resolvedConsolidationTransaction ?? selectedConsolidationTransaction;

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

      {mode === "consolidation" &&
      canManageConsolidations &&
      consolidationTransaction ? (
        <ConsolidationsList
          transaction={consolidationTransaction}
          open={
            !!consolidateId && consolidationTransaction.id === consolidateId
          }
          onOpenChange={(open) => {
            if (!open) {
              if (resolvedConsolidationTransaction) {
                setSelectedConsolidationTransaction(
                  resolvedConsolidationTransaction
                );
              }
              setConsolidateId(null);
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
          consolidationActions:
            mode === "consolidation" && canManageConsolidations,
          isConsolidated: mode === "consolidation",
          consolidationGroup: mode === "consolidation",
        }}
        filtersSlot={
          <DataTableFilters onReset={reset} hasActiveFilters={isActive}>
            <StringFilter label="Keyword" control={filter.keyword} />

            <DateFilter label="From date" control={filter.from} />

            <DateFilter label="To date" control={filter.to} />

            <NumberFilter label="From amount" control={filter.fromAmount} />

            <NumberFilter label="To amount" control={filter.toAmount} />

            {mode === "consolidation" && (
              <>
                <BooleanFilter
                  label="Consolidated"
                  control={filter.isConsolidated}
                  trueLabel="Consolidated"
                  falseLabel="Not consolidated"
                />

                <BooleanFilter
                  label="Has GST"
                  control={filter.hasGst}
                  trueLabel="with GST"
                  falseLabel="Without GST"
                />

                <EnumFilter
                  label="Consolidation group"
                  control={filter.consolidationGroup}
                  options={transactionConsolidationGroups.map((group) => ({
                    value: group,
                    label: CONSOLIDATION_GROUP_LABELS[group],
                  }))}
                />

                <EnumFilter
                  label="Budget Category"
                  control={filter.budgetCategory}
                  options={transactionBudgetCategories.map((category) => ({
                    value: category,
                    label: BUDGET_CATEGORY_LABELS[category],
                  }))}
                />

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
