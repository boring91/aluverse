import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";
import { ConsolidationGroupBadge } from "../components/consolidation-group-badge";

type Consolidation =
  inferRouterOutputs<AppRouter>["consolidations"]["list"]["items"][number];

export const useConsolidationsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>
) => {
  return useMemo<ColumnDef<Consolidation>[]>(() => {
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
                item.amount < 0 ? "text-rose-500" : "text-emerald-500"
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
        id: "consolidationGroup",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Consolidation group" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            item.consolidationGroup && (
              <div className="flex flex-col gap-1 items-center">
                <ConsolidationGroupBadge group={item.consolidationGroup} />
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
