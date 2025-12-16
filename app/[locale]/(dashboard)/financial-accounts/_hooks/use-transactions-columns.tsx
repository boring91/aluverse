import {
    DataTableColumnHeader,
    DataTableActions,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { CheckIcon, XIcon, ChartPie } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Transaction =
    inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

export const useTransactionsColumns = (
    mode: "account" | "consolidation",
    handleUpdate: (itemId: string) => void,
    handleDelete: (itemId: string) => void,
    handleConsolidate: (itemId: string) => void,
    currentlyProcessing: Set<string>
) => {
    const t = useTranslations("FinancialAccounts");
    const tc = useTranslations("Common");

    return useMemo<ColumnDef<Transaction>[]>(() => {
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
                                      handleDelete={handleDelete}
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
                                      onClick={() => handleConsolidate(item.id)}
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
        handleDelete,
        handleUpdate,
        handleConsolidate,
        mode,
    ]);
};
