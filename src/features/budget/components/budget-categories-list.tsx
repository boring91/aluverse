import {
  BooleanFilter,
  DataTable,
  DataTableFilters,
  StringFilter,
  useDataTable,
  useDataTableFilters,
} from "@/components/data-table";
import { PageLoader } from "@/components/page-loader";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useConfirm } from "@/lib/confirm-context";
import { useTRPC } from "@/trpc";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { useBudgetCategoriesColumns } from "../hooks/use-budget-categories-columns";
import { budgetCategoryFiltersSchema } from "../schemas/budgets.shared-schema";
import { CreateBudgetCategory } from "./create-budget-category";

export const BudgetCategoriesList = () => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("budgetCategories.read");
  const canCreate = hasPermission("budgetCategories.create");
  const canUpdate = hasPermission("budgetCategories.update");
  const canDelete = hasPermission("budgetCategories.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );

  const handleDelete = (id: string) => {
    if (!canDelete) {
      return;
    }

    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(id)));
        deleteAction.mutate({ id });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const { filter, reset, isActive, raw } = useDataTableFilters(
    budgetCategoryFiltersSchema,
  );

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.budgetCategories.list.queryOptions(
      {
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
        filters: raw,
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      },
    ),
  );

  const deleteAction = useMutation(
    trpc.budgetCategories.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.budgetCategories.list.queryOptions({
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          }),
        );
        toast.success("Deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, { id }) => {
        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
      },
    }),
  );

  const columns = useBudgetCategoriesColumns(
    canUpdate ? setItemId : undefined,
    canDelete ? handleDelete : undefined,
    currentlyProcessing,
  );

  if (isPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to budget categories.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateBudgetCategory
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
              dataTable.setOpenCreateSheet(true);
              return;
            }

            setItemId(null);
            dataTable.setOpenCreateSheet(false);
          }}
          itemId={itemId}
        />
      ) : null}
      <DataTable
        columns={columns}
        data={data}
        {...dataTable}
        setOpenCreateSheet={
          canCreate ? dataTable.setOpenCreateSheet : undefined
        }
        filtersSlot={
          <DataTableFilters onReset={reset} hasActiveFilters={isActive}>
            <StringFilter label="Keyword" control={filter.keyword} />
            <BooleanFilter
              label="Including GST"
              control={filter.includingGst}
              trueLabel="Yes"
              falseLabel="No"
            />
          </DataTableFilters>
        }
      />
    </>
  );
};
