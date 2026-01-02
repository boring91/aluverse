import {
  DataTableColumnHeader,
  DataTableActions,
  DataTable,
} from "@/components/data-table";
import { useDataTable } from "@/components/data-table/hooks/use-data-table";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import {
  useQueryClient,
  useQuery,
  keepPreviousData,
  useMutation,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateSupply } from "./create-supply";
import { formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/lib/confirm-context";
import { CheckIcon, XIcon } from "lucide-react";

type ProjectSupply =
  inferRouterOutputs<AppRouter>["projectSupplies"]["list"]["items"][number];

const useColumns = (
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  currentlyProcessing: Set<string>
) => {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");

  return useMemo<ColumnDef<ProjectSupply>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("name")} />
        ),
      },

      {
        id: "quantity",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("quantity")}
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="font-mono flex items-center justify-center">
              {item.quantity.toFixed(2)}
            </p>
          );
        },
      },

      {
        id: "unitPrice",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("unitPrice")}
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="font-mono flex items-center justify-center">
              {formatCurrency(item.unitPrice)}
            </p>
          );
        },
      },

      {
        id: "isConsolidated",
        header: ({ column }) => (
          <DataTableColumnHeader
            className="text-center"
            column={column}
            title={t("isConsolidated")}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="flex items-center justify-center">
              {item.isConsolidated ? (
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
  }, [t, tc, currentlyProcessing, handleDelete, handleUpdate]);
};

type Props = {
  projectId: string;
};

export const SuppliesList = ({ projectId }: Props) => {
  const tc = useTranslations("Common");
  const { confirm } = useConfirm();

  const [itemId, setItemId] = useState<string | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const handleDelete = (itemId: string) => {
    confirm({
      title: tc("delete"),
      description: tc("areYouSureYouWantToDeleteThisItem"),
      onConfirm: () => {
        setCurrentlyProcessing((set) => new Set(set.add(itemId)));
        deleteMutation.mutate({ id: itemId });
      },
    });
  };

  const dataTable = useDataTable({
    pageSize: 100,
  });

  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.projectSupplies.list.queryOptions(
      {
        projectId,
        pagination: dataTable.pagination,
        sorting: dataTable.sorting,
      },
      {
        placeholderData: keepPreviousData,
      }
    )
  );

  const deleteMutation = useMutation(
    trpc.projectSupplies.delete.mutationOptions({
      onSuccess: (data) => {
        const id = data.id;
        queryClient.invalidateQueries(
          trpc.projectSupplies.list.queryOptions({
            projectId,
            pagination: dataTable.pagination,
            sorting: dataTable.sorting,
          })
        );
        queryClient.invalidateQueries(
          trpc.projects.get.queryOptions({ id: projectId })
        );
        queryClient.invalidateQueries(trpc.projects.list.queryOptions({}));
        setCurrentlyProcessing((set) => {
          set.delete(id);
          return new Set(set);
        });
        toast.success(tc("deletedSuccessfully"));
      },

      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const columns = useColumns(setItemId, handleDelete, currentlyProcessing);

  return (
    <>
      <CreateSupply
        projectId={projectId}
        open={dataTable.openCreateSheet || !!itemId}
        onOpenChange={(value) => {
          if (value) {
            dataTable.setOpenCreateSheet(true);
            return;
          }

          setItemId(null);
          dataTable.setOpenCreateSheet(false);
        }}
        itemId={itemId}
      />
      <DataTable columns={columns} data={data} {...dataTable} />
    </>
  );
};
