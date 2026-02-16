import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { ConsolidationGroupBadge } from "@/features/consolidations/components/consolidation-group-badge";
import { cn } from "@/lib/client-utils";
import { transactionBudgetCategories } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { ChartPie, CheckIcon, HourglassIcon, XIcon } from "lucide-react";
import { useMemo } from "react";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

const BUDGET_CATEGORY_LABELS: Record<
  (typeof transactionBudgetCategories)[number],
  string
> = {
  subscription: "Subscription",
  consumable: "Consumable",
  toll: "Toll",
  tool: "Tool",
  food: "Food",
  salary: "Salary",
  fuel: "Fuel",
};

export const useTransactionsColumns = (
  handleUpdate: (itemId: string) => void,
  handleDelete: (itemId: string) => void,
  handleConsolidation: (itemId: string) => void,
  currentlyProcessing: Set<string>,
  isConsolidationMode: boolean
) => {
  return useMemo<ColumnDef<Transaction>[]>(() => {
    return [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => row.original.date.toDateString(),
      },

      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p className="wrap-break-word whitespace-normal">
                {item.description}
              </p>
              {isConsolidationMode && (
                <p className="text-muted-foreground text-xs">
                  {item.account.name}
                </p>
              )}
            </div>
          );
        },
      },

      {
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p
              className={cn(
                "font-mono",
                item.amount < 0 ? "text-rose-500" : "text-emerald-500"
              )}
            >
              {formatCurrency(item.amount)}
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
            title="Is consolidated"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-center flex-col gap-2">
              {item.isConsolidated ? (
                <CheckIcon className="text-emerald-500" size={16} />
              ) : (
                <XIcon className="text-rose-500" size={16} />
              )}

              {item.amount !== item.consolidatedAmount && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <HourglassIcon size={10} />
                  <span className="font-mono">
                    {formatCurrency(item.amount - item.consolidatedAmount)}
                  </span>
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "consolidationGroup",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            className="text-center"
            title="Consolidation group"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return item.consolidations.length === 1 ? (
            <div className="flex flex-col gap-1 items-center">
              {/* Group */}
              <ConsolidationGroupBadge
                group={item.consolidations[0].consolidationGroup}
              />

              {/* Extra details */}
              <div className="text-xs text-muted-foreground flex gap-2">
                {item.consolidations[0].project && (
                  <span>{item.consolidations[0].project.humanId}</span>
                )}
                {item.consolidations[0].budgetCategory && (
                  <span>
                    {
                      BUDGET_CATEGORY_LABELS[
                        item.consolidations[0].budgetCategory
                      ]
                    }
                  </span>
                )}
                {item.consolidations[0].isGst && <span>with GST</span>}
              </div>
            </div>
          ) : item.consolidations.length > 1 ? (
            <p className="text-xs text-muted-foreground flex items-center justify-center">
              {`${item.consolidations.length} consolidations`}
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
    currentlyProcessing,
    handleDelete,
    handleConsolidation,
    handleUpdate,
    isConsolidationMode,
  ]);
};
