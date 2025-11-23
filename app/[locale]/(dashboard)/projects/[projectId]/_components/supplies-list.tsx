import { ConfirmDialog } from "@/components/confirm-dialog";
import {
    DataTableColumnHeader,
    DataTableActions,
    DataTable,
} from "@/components/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useRowActionState } from "@/hooks/use-row-action-state";
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
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CreateSupply } from "./create-supply";
import { formatCurrency } from "@/lib/utils";

type ProjectSupply =
    inferRouterOutputs<AppRouter>["projectSupplies"]["list"]["items"][number];

type Props = {
    projectId: string;
};

export const SuppliesList = ({ projectId }: Props) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    const {
        currentlyUpdatingItemId,
        setCurrentlyUpdatingItemId,
        currentlyDeletingItemId,
        setCurrentlyDeletingItemId,
        currentlyProcessing,
        setCurrentlyProcessing,
    } = useRowActionState();

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
                columnFilters: dataTable.columnFilters,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deletionMutation = useMutation(
        trpc.projectSupplies.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.projectSupplies.list.queryOptions({
                        projectId,
                        pagination: dataTable.pagination,
                        sorting: dataTable.sorting,
                        columnFilters: dataTable.columnFilters,
                    })
                );
                setCurrentlyProcessing(set => {
                    set.delete(id);
                    return new Set(set);
                });
                toast.success(tc("deletedSuccessfully"));
            },

            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const handleUpdate = useCallback(
        (itemId: string) => {
            setCurrentlyUpdatingItemId(itemId);
            dataTable.setOpenCreateSheet(true);
        },
        [dataTable, setCurrentlyUpdatingItemId]
    );

    const handleDelete = () => {
        if (!currentlyDeletingItemId) return;
        deletionMutation.mutate({ id: currentlyDeletingItemId });
        setCurrentlyDeletingItemId(undefined);
    };

    const columns = useMemo<ColumnDef<ProjectSupply>[]>(() => {
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
                    />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <p className="font-mono">{item.quantity.toFixed(2)}</p>
                    );
                },
            },

            {
                id: "unitPrice",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t("unitPrice")}
                    />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <p className="font-mono">
                            {formatCurrency(item.unitPrice)}
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
                            setCurrentlyDeletingItemId={
                                setCurrentlyDeletingItemId
                            }
                            currentlyProcessing={currentlyProcessing}
                        />
                    );
                },
            },
        ];
    }, [t, tc, currentlyProcessing, setCurrentlyDeletingItemId, handleUpdate]);

    return (
        <>
            <ConfirmDialog
                title={tc("delete")}
                description={tc("areYouSureYouWantToDeleteThisItem")}
                open={!!currentlyDeletingItemId}
                onOpenChange={() => setCurrentlyDeletingItemId(undefined)}
                onConfirm={handleDelete}
            />
            <CreateSupply
                projectId={projectId}
                open={dataTable.openCreateSheet}
                onOpenChange={value => {
                    if (value) {
                        dataTable.setOpenCreateSheet(true);
                        return;
                    }

                    setCurrentlyUpdatingItemId(undefined);
                    dataTable.setOpenCreateSheet(false);
                }}
                itemId={currentlyUpdatingItemId}
            />
            <DataTable columns={columns} data={data} {...dataTable} />
        </>
    );
};
