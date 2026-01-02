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
import { ChartPie, CheckIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

export const useTransactionsColumns = (
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  handleConsolidation: (itemId: string) => void,
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
          <DataTableColumnHeader column={column} title={tc("description")} />
        ),
      },

      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("amount")} />
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

      // Account-specific columns:
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

      // Consolidation-specific columns:
      {
        id: "isConsolidated",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t("isConsolidated")}
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="flex items-center justify-center">
              {item.isConsolidated ? (
                <CheckIcon className="text-emerald-500" size={16} />
              ) : (
                <XIcon className="text-rose-500" size={16} />
              )}
            </p>
          );
        },
      },
      {
        id: "consolidationGroup",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            className="text-center"
            title={t("consolidationGroup")}
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return item.consolidations.length === 1 ? (
            <div className="flex flex-col gap-1 items-center">
              {/* Group */}
              <div
                className={cn(
                  "rounded-xl inline-flex px-2 py-0.5 items-center justify-center text-white text-xs font-bold",
                  {
                    "bg-sky-400":
                      item.consolidations[0].consolidationGroup === "budget",
                    "bg-rose-400":
                      item.consolidations[0].consolidationGroup ===
                      "unclassified",
                    "bg-emerald-400":
                      item.consolidations[0].consolidationGroup === "project",
                    "bg-amber-400 dark:bg-amber-600":
                      item.consolidations[0].consolidationGroup === "loan",
                  }
                )}
              >
                {t(item.consolidations[0].consolidationGroup)}
              </div>

              {/* Extra details */}
              <div className="text-xs text-muted-foreground flex gap-2">
                {item.consolidations[0].project && (
                  <span>{item.consolidations[0].project.humanId}</span>
                )}
                {item.consolidations[0].budgetCategory && (
                  <span>{t(item.consolidations[0].budgetCategory)}</span>
                )}
                {item.consolidations[0].isGst && <span>{t("withGst")}</span>}
              </div>
            </div>
          ) : item.consolidations.length > 1 ? (
            <p className="text-xs text-muted-foreground flex items-center justify-center">
              {t("countConsolidations", {
                count: item.consolidations.length,
              })}
            </p>
          ) : null;
        },
      },
      {
        id: "consolidationActions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleConsolidation(item.id)}
              >
                <ChartPie />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [
    t,
    tc,
    currentlyProcessing,
    handleDelete,
    handleConsolidation,
    handleUpdate,
  ]);
};
