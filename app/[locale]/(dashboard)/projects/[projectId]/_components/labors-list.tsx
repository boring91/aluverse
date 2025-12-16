import {
    DataTableColumnHeader,
    DataTableActions,
    DataTable,
} from "@/components/data-table";
import { useDataTable } from "@/hooks/use-data-table";
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
import { CreateLabor } from "./create-labor";
import { formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/lib/confirm-context";

type ProjectLabor =
    inferRouterOutputs<AppRouter>["projectLabors"]["list"]["items"][number];

const useColumns = (
    handleUpdate: (itemId: string) => void,
    handleDelete: (itemId: string) => void,
    currentlyProcessing: Set<string>
) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return useMemo<ColumnDef<ProjectLabor>[]>(() => {
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

export const LaborsList = ({ projectId }: Props) => {
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
                setCurrentlyProcessing(set => new Set(set.add(itemId)));
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

    const deleteMutation = useMutation(
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

    const columns = useColumns(setItemId, handleDelete, currentlyProcessing);

    return (
        <>
            <CreateLabor
                projectId={projectId}
                open={dataTable.openCreateSheet || !!itemId}
                onOpenChange={value => {
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
