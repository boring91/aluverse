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
import { CreateLabor } from "./create-labor";
import { formatCurrency } from "@/lib/utils";

type ProjectLabor =
    inferRouterOutputs<AppRouter>["projectLabors"]["list"]["items"][number];

type Props = {
    projectId: string;
};

export const LaborsList = ({ projectId }: Props) => {
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
        trpc.projectLabors.list.queryOptions(
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
        trpc.projectLabors.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.projectLabors.list.queryOptions({
                        projectId,
                        pagination: dataTable.pagination,
                        sorting: dataTable.sorting,
                        columnFilters: dataTable.columnFilters,
                    })
                );
                queryClient.invalidateQueries(
                    trpc.projects.get.queryOptions({ id: projectId })
                );
                queryClient.invalidateQueries(
                    trpc.projects.list.queryOptions({})
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

    const columns = useMemo<ColumnDef<ProjectLabor>[]>(() => {
        return [
            {
                accessorKey: "name",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={tc("name")} />
                ),
            },

            {
                id: "hours",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t("hours")} />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return <p className="font-mono">{item.hours.toFixed(2)}</p>;
                },
            },

            {
                id: "rate",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={t("rate")} />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <p className="font-mono">{formatCurrency(item.rate)}</p>
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
            <CreateLabor
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
