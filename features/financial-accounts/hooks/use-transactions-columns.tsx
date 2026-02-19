import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { ReconciliationGroupBadge } from "@/features/reconciliations/components/reconciliation-group-badge";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import type { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { ChartPie, CheckIcon, HourglassIcon, XIcon } from "lucide-react";
import { useMemo } from "react";

type Transaction =
  inferRouterOutputs<AppRouter>["transactions"]["list"]["items"][number];

export const useTransactionsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  handleReconciliation: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
  isReconciliationMode: boolean
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
              {isReconciliationMode && (
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

      // Reconciliation-specific columns:
      {
        id: "isReconciled",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Is reconciled"
            className="text-center"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-center flex-col gap-2">
              {item.isReconciled ? (
                <CheckIcon className="text-emerald-500" size={16} />
              ) : (
                <XIcon className="text-rose-500" size={16} />
              )}

              {item.amount !== item.reconciledAmount && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <HourglassIcon size={10} />
                  <span className="font-mono">
                    {formatCurrency(item.amount - item.reconciledAmount)}
                  </span>
                </p>
              )}
            </div>
          );
        },
      },
      {
        id: "reconciliationGroup",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            className="text-center"
            title="Reconciliation group"
          />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return item.reconciliations.length === 1 ? (
            <div className="flex flex-col gap-1 items-center">
              {/* Group */}
              <ReconciliationGroupBadge
                group={item.reconciliations[0].reconciliationGroup}
              />

              {/* Extra details */}
              <div className="text-xs text-muted-foreground flex gap-2">
                {item.reconciliations[0].project && (
                  <span>{item.reconciliations[0].project.humanId}</span>
                )}
                {item.reconciliations[0].budgetCategory && (
                  <span>{item.reconciliations[0].budgetCategory.name}</span>
                )}
                {item.reconciliations[0].isGst && <span>with GST</span>}
              </div>
            </div>
          ) : item.reconciliations.length > 1 ? (
            <p className="text-xs text-muted-foreground flex items-center justify-center">
              {`${item.reconciliations.length} reconciliations`}
            </p>
          ) : null;
        },
      },
      {
        id: "reconciliationActions",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2">
              {handleReconciliation ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleReconciliation(item.id)}
                >
                  <ChartPie />
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ];
  }, [
    currentlyProcessing,
    handleDelete,
    handleReconciliation,
    handleUpdate,
    isReconciliationMode,
  ]);
};
