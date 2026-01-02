import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { ConsolidationGroupBadge } from "../components/consolidation-group-badge";

type Consolidation =
  inferRouterOutputs<AppRouter>["consolidations"]["list"]["items"][number];

export const useConsolidationsColumns = (
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  currentlyProcessing: Set<string>
) => {
  const t = useTranslations("FinancialAccounts");
  const tc = useTranslations("Common");

  return useMemo<ColumnDef<Consolidation>[]>(() => {
    return [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={tc("date")} />
        ),
        cell: ({ row }) => row.original.transaction.date.toDateString(),
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
          const isExpense = row.original.transaction.type === "expense";
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
                <ConsolidationGroupBadge group={item.consolidationGroup} />

                {/* Extra details */}
                <div className="text-xs text-muted-foreground flex gap-2">
                  {item.project && <span>{item.project.humanId}</span>}
                  {item.budgetCategory && <span>{t(item.budgetCategory)}</span>}
                  {item.isGst && <span>{t("withGst")}</span>}
                </div>
              </div>
            )
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
