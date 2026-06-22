import {
  DataTableColumnHeader,
  DataTableActions,
  DataTable,
} from "@/components/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { useTRPC } from "@/trpc";
import type { AppRouter } from "@/trpc/router";
import {
  useQueryClient,
  useQuery,
  keepPreviousData,
  useMutation,
} from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateLoanPayoff } from "./create-loan-payoff";
import { formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/lib/confirm-context";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

type LoanPayoff =
  inferRouterOutputs<AppRouter>["loanPayoffs"]["list"]["items"][number];

const useColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<LoanPayoff>[]>(() => {
    return [
      {
        id: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p>{item.date.toDateString()}</p>;
        },
      },

      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p className="font-mono">{formatCurrency(item.amount)}</p>;
        },
      },

      {
        id: "notes",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="text-muted-foreground text-sm">{item.notes || "-"}</p>
          );
        },
      },

      {
        id: "actions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <DataTableActions
              itemId={item.id}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              currentlyProcessing={currentlyProcessing}
            />
          );
        },
      },
    ];
  }, [currentlyProcessing, handleDelete, handleUpdate]);
};

type Props = {
  loanId: string;
};

export const PayoffsList = ({ loanId }: Props) => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("loanPayoffs.read");
  const canCreate = hasPermission("loanPayoffs.create");
  const canUpdate = hasPermission("loanPayoffs.update");
  const canDelete = hasPermission("loanPayoffs.delete");

  const [itemId, setItemId] = useState<string | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );

  const handleDelete = (itemId: string) => {
    if (!canDelete) {
      return;
    }

    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(itemId)));
        deleteAction.mutate({ id: itemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.loanPayoffs.list.queryOptions(
      {
        loanId,
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      },
    ),
  );

  const deleteAction = useMutation(
    trpc.loanPayoffs.delete.mutationOptions({
      onSuccess: (data) => {
        const id = data.id;
        queryClient.invalidateQueries(
          trpc.loanPayoffs.list.queryOptions({
            loanId,
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          }),
        );
        queryClient.invalidateQueries(
          trpc.loans.get.queryOptions({ id: loanId }),
        );
        queryClient.invalidateQueries(trpc.loans.list.queryOptions({}));
        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
        toast.success("Deleted successfully");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const columns = useColumns(
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
        You do not have access to loan payoffs.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateLoanPayoff
          loanId={loanId}
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
