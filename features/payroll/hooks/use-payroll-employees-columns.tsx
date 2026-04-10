"use client";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employmentTypeLabels, employmentTypes } from "@/lib/constants";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type PayrollEmployee =
  inferRouterOutputs<AppRouter>["payroll"]["listEmployees"]["items"][number];

type EmploymentType = (typeof employmentTypes)[number];

const STATUS_VARIANTS: Record<
  NonNullable<PayrollEmployee["status"]>,
  "default" | "outline" | "secondary"
> = {
  Active: "default",
  Incomplete: "secondary",
  Terminated: "outline",
};

function formatStartDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-AU");
}

export function usePayrollEmployeesColumns(
  canWrite: boolean,
  currentlyProcessing: Set<number>,
  handleSendOnboardingEmail: ((employee: PayrollEmployee) => void) | undefined
) {
  return useMemo<ColumnDef<PayrollEmployee>[]>(() => {
    const columns: ColumnDef<PayrollEmployee>[] = [
      {
        id: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        accessorFn: (employee) =>
          `${employee.firstName ?? ""} ${employee.surname ?? ""}`.trim(),
        cell: ({ row }) => {
          const employee = row.original;
          const fullName =
            `${employee.firstName ?? ""} ${employee.surname ?? ""}`.trim() ||
            "Unnamed employee";

          return (
            <div className="flex flex-col gap-1">
              <p className="font-medium">{fullName}</p>
              {employee.preferredName ? (
                <p className="text-muted-foreground text-xs">
                  Preferred name: {employee.preferredName}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "email",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Email" />
        ),
        accessorKey: "emailAddress",
        cell: ({ row }) => {
          return (
            <p className="text-sm">
              {row.original.emailAddress || "No email provided"}
            </p>
          );
        },
      },
      {
        id: "employmentType",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employment type" />
        ),
        accessorKey: "employmentType",
        cell: ({ row }) => {
          const employmentType = row.original.employmentType as
            | EmploymentType
            | null
            | undefined;

          return (
            <Badge variant="outline">
              {employmentType
                ? (employmentTypeLabels[employmentType] ?? employmentType)
                : "—"}
            </Badge>
          );
        },
      },
      {
        id: "startDate",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Start date" />
        ),
        accessorKey: "startDate",
        cell: ({ row }) => {
          return <p>{formatStartDate(row.original.startDate)}</p>;
        },
      },
      {
        id: "status",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        accessorKey: "status",
        cell: ({ row }) => {
          const status = row.original.status;

          return (
            <Badge variant={status ? STATUS_VARIANTS[status] : "outline"}>
              {status ?? "Unknown"}
            </Badge>
          );
        },
      },
    ];

    if (canWrite && handleSendOnboardingEmail) {
      columns.push({
        id: "actions",
        cell: ({ row }) => {
          const employee = row.original;

          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                disabled={
                  currentlyProcessing.has(employee.id) || !employee.emailAddress
                }
                onClick={() => handleSendOnboardingEmail(employee)}
              >
                Send onboarding email
              </Button>
            </div>
          );
        },
      });
    }

    return columns;
  }, [canWrite, currentlyProcessing, handleSendOnboardingEmail]);
}
