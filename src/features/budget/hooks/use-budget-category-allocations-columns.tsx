import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { formatCurrency } from "@/lib/utils";
import { formatCalendarDate } from "@/lib/date";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type BudgetCategoryAllocation =
  inferRouterOutputs<AppRouter>["budgetCategoryAllocations"]["list"]["items"][number];

export const useBudgetCategoryAllocationsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<BudgetCategoryAllocation>[]>(() => {
    return [
      {
        id: "effectiveDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Effective date" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p>{formatCalendarDate(item.effectiveDate)}</p>;
        },
      },
      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p className="font-mono">{formatCurrency(item.amount)}</p>;
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
