import { DataTable } from "@/components/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { PageLoader } from "@/components/page-loader";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useConfirm } from "@/lib/confirm-context";
import { useTRPC } from "@/trpc/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useBudgetCategoryAllocationsColumns } from "../hooks/use-budget-category-allocations-columns";
import { CreateBudgetCategoryAllocation } from "./create-budget-category-allocation";

type Props = {
  budgetCategoryId: string;
};

export const BudgetCategoryAllocationsList = ({ budgetCategoryId }: Props) => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("budgetCategoryAllocations.read");
  const canCreate = hasPermission("budgetCategoryAllocations.create");
  const canUpdate = hasPermission("budgetCategoryAllocations.update");
  const canDelete = hasPermission("budgetCategoryAllocations.delete");

  const [itemId, setItemId] = useState<string | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
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
        deleteMutation.mutate({ id });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.budgetCategoryAllocations.list.queryOptions(
      {
        budgetCategoryId,
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      }
    )
  );

  const deleteMutation = useMutation(
    trpc.budgetCategoryAllocations.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.budgetCategoryAllocations.list.queryOptions({
            budgetCategoryId,
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          })
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
    })
  );

  const columns = useBudgetCategoryAllocationsColumns(
    canUpdate ? setItemId : undefined,
    canDelete ? handleDelete : undefined,
    currentlyProcessing
  );

  if (isPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to budget category allocations.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateBudgetCategoryAllocation
          budgetCategoryId={budgetCategoryId}
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
      />
    </>
  );
};
