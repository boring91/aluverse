import { useDataTable } from "@/hooks/use-data-table";
import { useTRPC } from "@/trpc/client";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CreateTransaction } from "../[accountId]/_components/create-transaction";
import { DataTable } from "@/components/data-table";
import { useConfirm } from "@/lib/confirm-context";
import { parseAsString, useQueryState } from "nuqs";
import { useTransactionsColumns } from "../_hooks/use-transactions-columns";

type Props = {
    accountId: string;
};

export const TransactionsList = ({ accountId }: Props) => {
    const tc = useTranslations("Common");
    const { confirm } = useConfirm();

    const [itemId, setItemId] = useQueryState("itemId", parseAsString);
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

    const { setOpenCreateSheet, ...dataTable } = useDataTable({
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
                const transaction = data[0];
                queryClient.invalidateQueries(
                    trpc.transactions.list.queryOptions({ accountId })
                );
                queryClient.invalidateQueries(
                    trpc.transactions.get.queryOptions({ id: transaction.id })
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.list.queryOptions()
                );
                queryClient.invalidateQueries(
                    trpc.financialAccounts.get.queryOptions({
                        id: transaction.accountId,
                    })
                );
                setCurrentlyProcessing(set => {
                    set.delete(transaction.id);
                    return new Set(set);
                });
                toast.success(tc("deletedSuccessfully"));
            },

            onError: error => {
                toast.error(error.message);
            },
        })
    );

    const columns = useTransactionsColumns(
        setItemId,
        handleDelete,
        currentlyProcessing
    );

    return (
        <>
            {accountId && (
                <CreateTransaction
                    accountId={accountId}
                    open={dataTable.openCreateSheet || !!itemId}
                    onOpenChange={value => {
                        if (value) {
                            setOpenCreateSheet(true);
                            return;
                        }

                        setItemId(null);
                        setOpenCreateSheet(false);
                    }}
                    itemId={itemId}
                />
            )}

            <DataTable
                columns={columns}
                data={data}
                {...dataTable}
                setOpenCreateSheet={setOpenCreateSheet}
            />
        </>
    );
};
