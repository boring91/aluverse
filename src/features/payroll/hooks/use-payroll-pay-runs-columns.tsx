"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";
import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { formatDateString } from "@/lib/shared-utils";
import type { AppRouter } from "@/trpc/router";

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
  currentlyProcessing: Set<string>,
  handleCalculate: ((payRun: PayrollPayRun) => void) | undefined,
  handleFinalize: ((payRun: PayrollPayRun) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
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
      {
        id: "actions",
        cell: ({ row }) => {
          const payRun = row.original;
          const itemId = payRun.id.toString();
          const isProcessing = currentlyProcessing.has(itemId);
          const canDelete = payRun.status !== "Finalized";
          const showCalculate =
            payRun.status !== "Finalized" && !!handleCalculate;
          const showFinalize =
            payRun.status === "Calculated" && !!handleFinalize;

          const extraItems =
            showCalculate || showFinalize ? (
              <>
                {showCalculate ? (
                  <DropdownMenuItem
                    disabled={isProcessing}
                    onClick={() => handleCalculate?.(payRun)}
                  >
                    Calculate
                  </DropdownMenuItem>
                ) : null}
                {showFinalize ? (
                  <DropdownMenuItem
                    disabled={isProcessing}
                    onClick={() => handleFinalize?.(payRun)}
                  >
                    Finalize
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : undefined;

          return (
            <DataTableActions
              itemId={itemId}
              handleDelete={canDelete ? handleDelete : undefined}
              currentlyProcessing={currentlyProcessing}
              detailsLink={
                payRun.status !== "Draft"
                  ? `/payroll/pay-runs/${payRun.id}`
                  : undefined
              }
              extraItems={extraItems}
            />
          );
        },
      },
    ];

    return columns;
  }, [currentlyProcessing, handleCalculate, handleDelete, handleFinalize]);
}
