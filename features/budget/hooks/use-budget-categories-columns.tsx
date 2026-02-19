import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";

type BudgetCategory =
  inferRouterOutputs<AppRouter>["budgetCategories"]["list"]["items"][number];

export const useBudgetCategoriesColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>
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
              <Link href={`/budgets/${category.id}`}>
                <p>
                  <span className="font-mono">{category.humanId}</span>
                  <span> - {category.name}</span>
                </p>
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
