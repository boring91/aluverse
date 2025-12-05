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
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import { CreateTransaction } from "../[accountId]/_components/create-transaction";
import { useRowActionState } from "@/hooks/use-row-action-state";
import {
    DataTable,
    DataTableActions,
    DataTableColumnHeader,
} from "@/components/data-table";
import { ConsolidateTransaction } from "./consolidate-transaction";
import { Button } from "@/components/ui/button";
import { ChartPie, CheckIcon, XIcon } from "lucide-react";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

type Props = {
    accountId?: string;
    mode: "account" | "consolidation";
};

export const TransactionsList = ({ accountId, mode = "account" }: Props) => {
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

    const { setOpenCreateSheet, ...dataTable } = useDataTable({
        pageSize: 100,
    });

    const [consolidatingTransaction, setConsolidatingTransaction] =
        useState<Transaction | null>(null);

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

    const handleUpdate = useCallback(
        (itemId: string) => {
            setCurrentlyUpdatingItemId(itemId);
            setOpenCreateSheet(true);
        },
        [setOpenCreateSheet, setCurrentlyUpdatingItemId]
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

            // Account-specific columns
            ...(mode === "account"
                ? [
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
                      } satisfies ColumnDef<Transaction>,
                  ]
                : []),

            // Consolidation-specific columns:
            ...(mode === "consolidation"
                ? ([
                      {
                          id: "isConsolidated",
                          header: ({ column }) => (
                              <DataTableColumnHeader
                                  column={column}
                                  title={t("isConsolidated")}
                              />
                          ),
                          cell: ({ row }) => {
                              const item = row.original;
                              return item.consolidationGroup ? (
                                  <CheckIcon
                                      className="text-emerald-500"
                                      size={16}
                                  />
                              ) : (
                                  <XIcon className="text-rose-500" size={16} />
                              );
                          },
                      },
                      {
                          id: "consolidationGroup",
                          header: ({ column }) => (
                              <DataTableColumnHeader
                                  column={column}
                                  title={t("consolidationGroup")}
                              />
                          ),
                          cell: ({ row }) => {
                              const item = row.original;
                              return (
                                  item.consolidationGroup && (
                                      <div className="flex flex-col gap-1 items-center">
                                          {/* Group */}
                                          <div
                                              className={cn(
                                                  "rounded-xl inline-flex px-2 py-0.5 items-center justify-center text-white text-xs font-bold",
                                                  {
                                                      "bg-sky-400":
                                                          item.consolidationGroup ===
                                                          "budget",
                                                      "bg-rose-400":
                                                          item.consolidationGroup ===
                                                          "unclassified",
                                                      "bg-emerald-400":
                                                          item.consolidationGroup ===
                                                          "project",
                                                  }
                                              )}
                                          >
                                              {t(item.consolidationGroup)}
                                          </div>

                                          {/* Extra details */}
                                          <div className="text-xs text-muted-foreground flex gap-2">
                                              {item.project && (
                                                  <span>
                                                      {item.project.humanId}
                                                  </span>
                                              )}
                                              {item.budgetCategory && (
                                                  <span>
                                                      {t(item.budgetCategory)}
                                                  </span>
                                              )}
                                              {item.isGst && (
                                                  <span>{t("withGst")}</span>
                                              )}
                                          </div>
                                      </div>
                                  )
                              );
                          },
                      },
                      {
                          id: "consolidation",
                          cell: ({ row }) => {
                              const item = row.original;
                              return (
                                  <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() =>
                                          setConsolidatingTransaction(item)
                                      }
                                  >
                                      <ChartPie />
                                  </Button>
                              );
                          },
                      },
                  ] satisfies ColumnDef<Transaction>[])
                : []),
        ];
    }, [
        t,
        tc,
        currentlyProcessing,
        setCurrentlyDeletingItemId,
        handleUpdate,
        mode,
        setConsolidatingTransaction,
    ]);

    return (
        <>
            <ConfirmDialog
                title={tc("delete")}
                description={tc("areYouSureYouWantToDeleteThisItem")}
                open={!!currentlyDeletingItemId}
                onOpenChange={() => setCurrentlyDeletingItemId(undefined)}
                onConfirm={handleDelete}
            />
            {accountId && (
                <CreateTransaction
                    accountId={accountId}
                    open={dataTable.openCreateSheet}
                    onOpenChange={value => {
                        if (value) {
                            setOpenCreateSheet(true);
                            return;
                        }

                        setCurrentlyUpdatingItemId(undefined);
                        setOpenCreateSheet(false);
                    }}
                    itemId={currentlyUpdatingItemId}
                />
            )}

            {mode === "consolidation" && consolidatingTransaction && (
                <ConsolidateTransaction
                    transaction={consolidatingTransaction}
                    open={!!consolidatingTransaction}
                    onOpenChange={open => {
                        if (!open) {
                            setConsolidatingTransaction(null);
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
            />
        </>
    );
};
