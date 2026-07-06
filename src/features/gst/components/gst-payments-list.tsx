import {
  DataTable,
  useDataTable,
  useDataTableFilters,
  DataTableFilters,
  DateFilter,
} from "@/components/data-table";
import { useTRPC } from "@/trpc";
import {
  useQueryClient,
  useQuery,
  keepPreviousData,
  useMutation,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CreateGstPayment } from "./create-gst-payment";
import { useConfirm } from "@/lib/confirm-context";
import { useQueryState, parseAsString } from "nuqs";
import { useGstPaymentsColumns } from "../hooks/use-gst-payments-columns";
import { gstPaymentFiltersSchema } from "../schemas/gst.shared-schema";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const GstPaymentsList = () => {
  const { confirm } = useConfirm();
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("gst.read");
  const canCreate = hasPermission("gst.create");
  const canUpdate = hasPermission("gst.update");
  const canDelete = hasPermission("gst.delete");

  const [itemId, setItemId] = useQueryState("itemId", parseAsString);

  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );

  const handleDelete = (deleteItemId: string) => {
    if (!canDelete) {
      return;
    }

    confirm({
      title: "Delete",
      description: "Are you sure you want to delete this GST payment?",
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(deleteItemId)));
        deleteAction.mutate({ id: deleteItemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const { filter, reset, isActive, raw } = useDataTableFilters(
    gstPaymentFiltersSchema,
  );

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.gst.listPayments.queryOptions(
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
    trpc.gst.deletePayment.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.gst.listPayments.queryOptions({
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

  const columns = useGstPaymentsColumns(
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
        You do not have access to GST payments.
      </p>
    );
  }

  return (
    <>
      {canCreate || canUpdate ? (
        <CreateGstPayment
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
            <DateFilter label="From date" control={filter.from} />
            <DateFilter label="To date" control={filter.to} />
          </DataTableFilters>
        }
      />
    </>
  );
};
