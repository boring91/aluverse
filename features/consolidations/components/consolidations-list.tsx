import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { useTRPC } from "@/trpc/client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { useConsolidationsColumns } from "../hooks/use-consolidations-columns";
import { CreateConsolidation } from "./create-consolidation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/lib/confirm-context";
import type { AppRouter } from "@/trpc/routers/_app";
import type { inferRouterOutputs } from "@trpc/server";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConsolidationsList = ({
  transaction,
  open,
  onOpenChange,
}: Props) => {
  const transactionId = transaction.id;
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("consolidations.read");
  const canCreate = hasPermission("consolidations.create");
  const canUpdate = hasPermission("consolidations.update");
  const canDelete = hasPermission("consolidations.delete");

  const [itemId, setItemId] = useState<string | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
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
        deleteMutation.mutate({ id: itemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
    disableUrlKeys: true,
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.consolidations.list.queryOptions(
      {
        transactionId,
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
      },
      {
        placeholderData: keepPreviousData,
        enabled: open && canRead,
      }
    )
  );

  const deleteMutation = useMutation(
    trpc.consolidations.delete.mutationOptions({
      onSuccess: (data) => {
        const id = data.id;
        queryClient.invalidateQueries(
          trpc.consolidations.list.queryOptions({ transactionId })
        );
        queryClient.invalidateQueries(
          trpc.consolidations.statistics.queryOptions()
        );
        queryClient.invalidateQueries(trpc.transactions.list.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.consolidations.getDefault.queryOptions({
            transactionId,
          })
        );

        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });

        toast("Deleted successfully");
      },

      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const columns = useConsolidationsColumns(
    canUpdate ? setItemId : undefined,
    canDelete ? handleDelete : undefined,
    currentlyProcessing
  );

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateConsolidation
          transaction={transaction}
          itemId={itemId}
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
        />
      ) : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Consolidations</DialogTitle>
            <DialogDescription>
              Assign this transaction to a consolidation group and categorize it
              accordingly.
            </DialogDescription>
            {transaction.description && (
              <p className="text-sm text-muted-foreground pt-2">
                {transaction.description}
              </p>
            )}
          </DialogHeader>

          <div className="max-h-[500px]">
            {isPending ? (
              <PageLoader variant="inline" />
            ) : !canRead ? (
              <p className="text-muted-foreground">
                You do not have access to consolidations.
              </p>
            ) : (
              <DataTable
                columns={columns}
                data={data}
                {...dataTable}
                setOpenCreateSheet={
                  canCreate ? dataTable.setOpenCreateSheet : undefined
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
