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
import { CreateTransaction } from "./create-transaction";
import {
    DataTable,
    DataTableFilters,
    BooleanFilter,
    useDataTable,
    useDataTableFilters,
    StringFilter,
    DateFilter,
} from "@/components/data-table";
import { useConfirm } from "@/lib/confirm-context";
import { parseAsString, useQueryState } from "nuqs";
import { useTransactionsColumns } from "../hooks/use-transactions-columns";
import { ConsolidationsList } from "@/features/consolidations/components/consolidations-list";
import { transactionFiltersSchema } from "../schemas/transaction.schema";

type Props = {
    mode: "account" | "consolidation";
    accountId?: string;
};

export const TransactionsList = ({ mode = "account", accountId }: Props) => {
    const tc = useTranslations("Common");
    const { confirm } = useConfirm();

    const [itemId, setItemId] = useQueryState("itemId", parseAsString);
    const [consolidateId, setConsolidateId] = useQueryState(
        "consolidateId",
        parseAsString
    );
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

    const { setOpenCreateSheet, ...dataTable } = useDataTable();

    const { filter, reset, isActive, raw } = useDataTableFilters(
        transactionFiltersSchema
    );

    const queryClient = useQueryClient();
    const trpc = useTRPC();
    const { data } = useQuery(
        trpc.transactions.list.queryOptions(
            {
                accountId,
                pagination: dataTable.pagination,
                sorting: dataTable.sorting,
                filters: raw,
            },
            {
                placeholderData: keepPreviousData,
            }
        )
    );

    const deleteMutation = useMutation(
        trpc.transactions.delete.mutationOptions({
            onSuccess: data => {
                const transaction = data;
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
        setConsolidateId,
        currentlyProcessing
    );

    return (
        <>
            {accountId && mode === "account" && (
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

            {consolidateId && mode === "consolidation" && (
                <ConsolidationsList
                    transactionId={consolidateId}
                    open={!!consolidateId}
                    onOpenChange={open => {
                        if (!open) {
                            setConsolidateId(null);
                        }
                    }}
                />
            )}

            <DataTable
                columns={columns}
                data={data}
                {...dataTable}
                setOpenCreateSheet={
                    mode === "account" ? setOpenCreateSheet : undefined
                }
                columnVisibility={{
                    actions: mode === "account",
                    consolidationActions: mode === "consolidation",
                    isConsolidated: mode === "consolidation",
                    consolidationGroup: mode === "consolidation",
                }}
                filtersSlot={
                    <DataTableFilters
                        onReset={reset}
                        hasActiveFilters={isActive}
                    >
                        <StringFilter
                            label={tc("keyword")}
                            control={filter.keyword}
                        />

                        <DateFilter
                            label={tc("fromDate")}
                            control={filter.from}
                        />

                        <DateFilter label={tc("toDate")} control={filter.to} />

                        {mode === "consolidation" && (
                            <BooleanFilter
                                label={tc("consolidated")}
                                control={filter.isConsolidated}
                                trueLabel={tc("consolidated")}
                                falseLabel={tc("notConsolidated")}
                            />
                        )}
                    </DataTableFilters>
                }
            />
        </>
    );
};
