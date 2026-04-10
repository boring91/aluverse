"use client";

import Link from "next/link";
import type { Route } from "next";
import { ColumnDef } from "@tanstack/react-table";
import { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";
import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateString } from "@/lib/shared-utils";
import { AppRouter } from "@/trpc/routers/_app";

type PayrollPayRun =
  inferRouterOutputs<AppRouter>["payroll"]["listPayRuns"]["items"][number];

const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
});

const STATUS_VARIANTS: Record<
  PayrollPayRun["status"],
  "default" | "outline" | "secondary"
> = {
  Draft: "outline",
  Calculated: "secondary",
  Finalized: "default",
};

function formatCurrencyFromCents(value: number | null | undefined) {
  if (value == null) {
    return "—";
  }

  return currencyFormatter.format(value / 100);
}

function formatPeriod(payRun: PayrollPayRun) {
  const start = formatDateString(payRun.payPeriodStarting);
  const end = formatDateString(payRun.payPeriodEnding);

  if (start === "—" && end === "—") {
    return "—";
  }

  return `${start} to ${end}`;
}

export function usePayrollPayRunsColumns(
  currentlyProcessing: Set<number>,
  handleCalculate: ((payRun: PayrollPayRun) => void) | undefined,
  handleFinalize: ((payRun: PayrollPayRun) => void) | undefined,
  handleDelete: ((payRun: PayrollPayRun) => void) | undefined
) {
  return useMemo<ColumnDef<PayrollPayRun>[]>(() => {
    const columns: ColumnDef<PayrollPayRun>[] = [
      {
        id: "paySchedule",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Pay schedule" />
        ),
        accessorFn: (payRun) =>
          payRun.payScheduleName ?? `Schedule ${payRun.payScheduleId}`,
        cell: ({ row }) => {
          return (
            <p className="font-medium">
              {row.original.payScheduleName ??
                `Schedule ${row.original.payScheduleId}`}
            </p>
          );
        },
      },
      {
        id: "period",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Pay period" />
        ),
        accessorFn: (payRun) => formatPeriod(payRun),
        cell: ({ row }) => {
          return <p>{formatPeriod(row.original)}</p>;
        },
      },
      {
        id: "datePaid",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Date paid" />
        ),
        accessorKey: "datePaid",
        cell: ({ row }) => {
          return <p>{formatDateString(row.original.datePaid)}</p>;
        },
      },
      {
        id: "totalGrossWagesInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Gross" />
        ),
        accessorKey: "totalGrossWagesInCents",
        cell: ({ row }) => {
          return (
            <p>
              {formatCurrencyFromCents(row.original.totalGrossWagesInCents)}
            </p>
          );
        },
      },
      {
        id: "totalNetWagesInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Net" />
        ),
        accessorKey: "totalNetWagesInCents",
        cell: ({ row }) => {
          return (
            <p>{formatCurrencyFromCents(row.original.totalNetWagesInCents)}</p>
          );
        },
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        accessorKey: "status",
        cell: ({ row }) => {
          return (
            <Badge variant={STATUS_VARIANTS[row.original.status]}>
              {row.original.status}
            </Badge>
          );
        },
      },
    ];

    if (handleCalculate || handleFinalize || handleDelete) {
      columns.push({
        id: "actions",
        cell: ({ row }) => {
          const payRun = row.original;
          const isProcessing = currentlyProcessing.has(payRun.id);

          return (
            <div className="flex justify-end gap-2">
              {handleCalculate && payRun.status !== "Finalized" ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => handleCalculate(payRun)}
                >
                  Calculate
                </Button>
              ) : null}

              {payRun.status !== "Draft" ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/payroll/pay-runs/${payRun.id}` as Route}>
                    Review
                  </Link>
                </Button>
              ) : null}

              {handleFinalize && payRun.status === "Calculated" ? (
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleFinalize(payRun)}
                >
                  Finalize
                </Button>
              ) : null}

              {handleDelete && payRun.status !== "Finalized" ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isProcessing}
                  onClick={() => handleDelete(payRun)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          );
        },
      });
    }

    return columns;
  }, [currentlyProcessing, handleCalculate, handleDelete, handleFinalize]);
}
