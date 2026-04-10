"use client";

import { DataTableColumnHeader } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { employmentTypeLabels, employmentTypes } from "@/lib/constants";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { formatDateString } from "@/lib/shared-utils";

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

export function usePayrollEmployeesColumns(
  canWrite: boolean,
  currentlyProcessing: Set<number>,
  handleSendOnboardingEmail: ((employee: PayrollEmployee) => void) | undefined,
  handleActivateEmployee: ((employee: PayrollEmployee) => void) | undefined,
  handleDeleteEmployee: ((employee: PayrollEmployee) => void) | undefined
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
          return <p>{formatDateString(row.original.startDate)}</p>;
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

    if (
      canWrite &&
      (handleSendOnboardingEmail ||
        handleActivateEmployee ||
        handleDeleteEmployee)
    ) {
      columns.push({
        id: "actions",
        cell: ({ row }) => {
          const employee = row.original;
          const isProcessing = currentlyProcessing.has(employee.id);
          const isIncomplete = employee.status === "Incomplete";
          const showActivate =
            isIncomplete &&
            employee.hasCompletedOnboarding &&
            handleActivateEmployee;
          const showOnboarding =
            isIncomplete &&
            !employee.hasCompletedOnboarding &&
            handleSendOnboardingEmail;

          return (
            <div className="flex justify-end gap-2">
              {showActivate ? (
                <Button
                  size="sm"
                  variant="default"
                  disabled={isProcessing}
                  onClick={() => handleActivateEmployee(employee)}
                >
                  Activate
                </Button>
              ) : null}
              {showOnboarding ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing || !employee.emailAddress}
                  onClick={() => handleSendOnboardingEmail(employee)}
                >
                  Send onboarding email
                </Button>
              ) : null}
              {handleDeleteEmployee ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isProcessing}
                  onClick={() => handleDeleteEmployee(employee)}
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
  }, [
    canWrite,
    currentlyProcessing,
    handleActivateEmployee,
    handleDeleteEmployee,
    handleSendOnboardingEmail,
  ]);
}
