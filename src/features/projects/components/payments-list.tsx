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
import { CreatePayment } from "./create-payment";
import { formatCurrency } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/date";
import { useConfirm } from "@/lib/confirm-context";
import { CheckIcon, XIcon } from "lucide-react";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

type ProjectPayment =
  inferRouterOutputs<AppRouter>["projectPayments"]["list"]["items"][number];

const useColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<ProjectPayment>[]>(() => {
    return [
      {
        id: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p>{formatCalendarDate(item.date)}</p>;
        },
      },

      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Amount"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="font-mono flex items-center justify-center">
              {formatCurrency(item.amount)}
            </p>
          );
        },
      },

      {
        id: "isReconciled",
        header: ({ column }) => (
          <DataTableColumnHeader
            className="text-center"
            column={column}
            title="Is reconciled"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="flex items-center justify-center">
              {item.isReconciled ? (
                <CheckIcon className="text-emerald-500" />
              ) : (
                <XIcon className="text-rose-500" />
              )}
            </p>
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
  projectId: string;
};

export const PaymentsList = ({ projectId }: Props) => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("projectItems.read");
  const canCreate = hasPermission("projectItems.create");
  const canUpdate = hasPermission("projectItems.update");
  const canDelete = hasPermission("projectItems.delete");

  const [itemId, setItemId] = useState<string | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );

  const handleDelete = (deleteItemId: string) => {
    if (!canDelete) {
      return;
    }

    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this item?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(deleteItemId)));
        deleteAction.mutate({ id: deleteItemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projectPayments.list.queryOptions(
      {
        projectId,
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
    trpc.projectPayments.delete.mutationOptions({
      onSuccess: (deletedPayment) => {
        const id = deletedPayment.id;
        queryClient.invalidateQueries(
          trpc.projectPayments.list.queryOptions({
            projectId,
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          }),
        );
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
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
        You do not have access to project items.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreatePayment
          projectId={projectId}
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
