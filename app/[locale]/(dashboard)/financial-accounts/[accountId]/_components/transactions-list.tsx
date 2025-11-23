import { useDataTable } from "@/hooks/use-data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { AppRouter } from "@/trpc/routers/_app";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { CreateTransaction } from "./create-transaction";
import { useRowActionState } from "@/hooks/use-row-action-state";
import {
    DataTable,
    DataTableActions,
    DataTableColumnHeader,
} from "@/components/data-table";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
    accountId: string;
};

export const TransactionsList = ({ accountId }: Props) => {
    const t = useTranslations("FinancialAccounts");
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
        trpc.transactions.list.queryOptions(
            {
                accountId,
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
        trpc.transactions.delete.mutationOptions({
            onSuccess: data => {
                const id = data[0].id;
                queryClient.invalidateQueries(
                    trpc.transactions.list.queryOptions({ accountId })
                );
                queryClient.invalidateQueries(
                    trpc.transactions.get.queryOptions({ id })
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.list.queryOptions()
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.get.queryOptions({ id: accountId })
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

    const handleDelete = useCallback(() => {
        if (!currentlyDeletingItemId) return;
        deleteMutation.mutate({ id: currentlyDeletingItemId });
        setCurrentlyDeletingItemId(undefined);
    }, [currentlyDeletingItemId, deleteMutation, setCurrentlyDeletingItemId]);

    const columns = useMemo<ColumnDef<Transaction>[]>(() => {
        return [
            {
                accessorKey: "date",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title={tc("date")} />
                ),
                cell: ({ row }) => row.original.date.toDateString(),
            },

            {
                accessorKey: "description",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={tc("description")}
                    />
                ),
            },

            {
                accessorKey: "amount",
                header: ({ column }) => (
                    <DataTableColumnHeader
                        column={column}
                        title={t("amount")}
                    />
                ),
                cell: ({ row }) => {
                    const isExpense = row.original.type === "expense";
                    return (
                        <p
                            className={cn(
                                "font-mono",
                                isExpense ? "text-rose-500" : "text-emerald-500"
                            )}
                        >
                            {isExpense
                                ? `(${formatCurrency(row.original.amount)})`
                                : formatCurrency(row.original.amount)}
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
            <CreateTransaction
                accountId={accountId}
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
