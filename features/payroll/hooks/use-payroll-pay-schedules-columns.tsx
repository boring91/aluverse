"use client";

import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type PayrollPaySchedule =
  inferRouterOutputs<AppRouter>["payroll"]["listPaySchedules"][number];

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-AU");
}

function getSchedulePurpose(schedule: PayrollPaySchedule) {
  if (schedule.frequency === "Weekly") {
    return "Casual employees";
  }

  if (schedule.frequency === "Monthly") {
    return "Salaried employees";
  }

  return "Custom";
}

export function usePayrollPaySchedulesColumns(
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  currentlyProcessing: Set<string>
) {
  return useMemo<ColumnDef<PayrollPaySchedule>[]>(() => {
    const columns: ColumnDef<PayrollPaySchedule>[] = [
      {
        id: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        accessorKey: "name",
        cell: ({ row }) => {
          return (
            <p className="font-medium">
              {row.original.name ?? `Schedule ${row.original.id}`}
            </p>
          );
        },
      },
      {
        id: "frequency",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Frequency" />
        ),
        accessorKey: "frequency",
        cell: ({ row }) => {
          return (
            <Badge variant="outline">{row.original.frequency ?? "—"}</Badge>
          );
        },
      },
      {
        id: "purpose",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Used for" />
        ),
        accessorFn: (schedule) => getSchedulePurpose(schedule),
        cell: ({ row }) => {
          return <p>{getSchedulePurpose(row.original)}</p>;
        },
      },
      {
        id: "employeeSelectionStrategy",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Selection strategy" />
        ),
        accessorKey: "employeeSelectionStrategy",
        cell: ({ row }) => {
          return <p>{row.original.employeeSelectionStrategy ?? "—"}</p>;
        },
      },
      {
        id: "lastPayRun",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last pay run" />
        ),
        accessorKey: "lastPayRun",
        cell: ({ row }) => {
          return <p>{formatDate(row.original.lastPayRun)}</p>;
        },
      },
      {
        id: "lastDatePaid",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Last paid" />
        ),
        accessorKey: "lastDatePaid",
        cell: ({ row }) => {
          return <p>{formatDate(row.original.lastDatePaid)}</p>;
        },
      },
    ];

    if (handleUpdate || handleDelete) {
      columns.push({
        id: "actions",
        cell: ({ row }) => {
          return (
            <DataTableActions
              itemId={row.original.id.toString()}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              currentlyProcessing={currentlyProcessing}
            />
          );
        },
      });
    }

    return columns;
  }, [currentlyProcessing, handleDelete, handleUpdate]);
}
