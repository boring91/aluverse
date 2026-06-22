import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import type { AppRouter } from "@/trpc/router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";
import { ReconciliationGroupBadge } from "../components/reconciliation-group-badge";

type Reconciliation =
  inferRouterOutputs<AppRouter>["reconciliations"]["list"]["items"][number];

export const useReconciliationsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<Reconciliation>[]>(() => {
    return [
      {
        accessorKey: "date",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date" />
        ),
        cell: ({ row }) => row.original.transaction.date.toDateString(),
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Description" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <p className="wrap-break-word whitespace-normal">
              {item.transaction.description}
            </p>
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
                item.amount < 0 ? "text-rose-500" : "text-emerald-500",
              )}
            >
              {item.amount < 0
                ? `(${formatCurrency(Math.abs(item.amount))})`
                : formatCurrency(item.amount)}
            </p>
          );
        },
      },
      {
        id: "reconciliationGroup",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Reconciliation group" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            item.reconciliationGroup && (
              <div className="flex flex-col gap-1 items-center">
                <ReconciliationGroupBadge group={item.reconciliationGroup} />
                <div className="text-xs text-muted-foreground flex gap-2">
                  {item.project && <span>{item.project.humanId}</span>}
                  {item.budgetCategory && (
                    <span>{item.budgetCategory.name}</span>
                  )}
                  {item.isGst && <span>with GST</span>}
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
  }, [currentlyProcessing, handleDelete, handleUpdate]);
};
