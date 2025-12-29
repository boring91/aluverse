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
import { CreatePayment } from "./create-payment";
import { formatCurrency } from "@/lib/utils";
import { useConfirm } from "@/lib/confirm-context";

type ProjectPayment =
    inferRouterOutputs<AppRouter>["projectPayments"]["list"]["items"][number];

const useColumns = (
    handleUpdate: (itemId: string) => void,
    handleDelete: (itemId: string) => void,
    currentlyProcessing: Set<string>
) => {
    const t = useTranslations("Projects");
    const tc = useTranslations("Common");

    return useMemo<ColumnDef<ProjectPayment>[]>(() => {
        return [
            {
                id: "date",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={tc("name")} />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return <p>{item.date.toDateString()}</p>;
                },
            },

            {
                id: "amount",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t("amount")}
                    />
                ),
                cell: ({ row }) => {
                    const item = row.original;
                    return (
                        <p className="font-mono">
                            {formatCurrency(item.amount)}
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

export const PaymentsList = ({ projectId }: Props) => {
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
        trpc.projectPayments.list.queryOptions(
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
        trpc.projectPayments.delete.mutationOptions({
            onSuccess: data => {
                const id = data.id;
                queryClient.invalidateQueries(
                    trpc.projectPayments.list.queryOptions({
                        projectId,
                        pagination: dataTable.pagination,
                        sorting: dataTable.sorting,
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
            <CreatePayment
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
