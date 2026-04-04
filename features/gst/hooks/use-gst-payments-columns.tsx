"use client";

import {
  DataTableColumnHeader,
  DataTableActions,
} from "@/components/data-table";
import { formatCurrency } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type GstPayment =
  inferRouterOutputs<AppRouter>["gst"]["listPayments"]["items"][number];

export const useGstPaymentsColumns = (
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>
) => {
  return useMemo<ColumnDef<GstPayment>[]>(() => {
    return [
      {
        id: "periodFrom",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Period" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {item.periodFrom.toLocaleDateString()} &ndash;{" "}
                {item.periodTo.toLocaleDateString()}
              </p>
            </div>
          );
        },
      },
      {
        id: "rate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Rate" />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return <p className="font-mono">{(item.rate * 100).toFixed(0)}%</p>;
        },
      },
      {
        id: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount Paid" />
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
