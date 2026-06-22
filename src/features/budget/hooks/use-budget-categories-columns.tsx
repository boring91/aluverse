import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";

import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { AppRouter } from "@/trpc/router";

type BudgetCategory =
  inferRouterOutputs<AppRouter>["budgetCategories"]["list"]["items"][number];

export const useBudgetCategoriesColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>,
) => {
  return useMemo<ColumnDef<BudgetCategory>[]>(() => {
    return [
      {
        id: "details",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Details" />
        ),
        cell: ({ row }) => {
          const category = row.original;
          return (
            <div className="flex flex-col gap-1">
              <Link
                params={{ budgetCategoryId: category.id }}
                to="/budgets/$budgetCategoryId"
              >
                <p>{category.name}</p>
              </Link>
            </div>
          );
        },
      },
      {
        id: "includingGst",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="GST mode" />
        ),
        cell: ({ row }) => {
          const category = row.original;
          return (
            <Badge variant={category.includingGst ? "default" : "secondary"}>
              {category.includingGst ? "GST included" : "GST excluded"}
            </Badge>
          );
        },
      },
      {
        id: "monthlyAllocation",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Monthly allocation" />
        ),
        cell: ({ row }) => {
          const category = row.original;
          return (
            <span className="font-mono">
              {formatCurrency(category.monthlyAllocation)}
            </span>
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
              detailsLink={`/budgets/${item.id}`}
            />
          );
        },
      },
    ];
  }, [currentlyProcessing, handleDelete, handleUpdate]);
};
