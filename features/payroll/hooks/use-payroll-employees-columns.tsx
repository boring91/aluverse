"use client";

import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { employmentTypeLabels } from "@/lib/constants";
import { formatDateString } from "@/lib/shared-utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

type PayrollEmployee =
  inferRouterOutputs<AppRouter>["payroll"]["listEmployees"]["items"][number];

const STATUS_VARIANTS: Record<
  NonNullable<PayrollEmployee["status"]>,
  "default" | "outline" | "secondary"
> = {
  Active: "default",
  Incomplete: "secondary",
  Terminated: "outline",
};

export function usePayrollEmployeesColumns(
  currentlyProcessing: Set<string>,
  handleUpdate: ((itemId: string) => void) | undefined,
  handleDelete: ((itemId: string) => void) | undefined,
  handleSendOnboardingEmail: ((employee: PayrollEmployee) => void) | undefined,
  handleActivateEmployee: ((employee: PayrollEmployee) => void) | undefined
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
          const employmentType = row.original.employmentType;

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
      {
        id: "actions",
        cell: ({ row }) => {
          const employee = row.original;
          const itemId = employee.id.toString();
          const isProcessing = currentlyProcessing.has(itemId);
          const isIncomplete = employee.status === "Incomplete";
          const showActivate =
            isIncomplete &&
            employee.hasCompletedOnboarding &&
            !!handleActivateEmployee;
          const showOnboarding =
            isIncomplete &&
            !employee.hasCompletedOnboarding &&
            !!handleSendOnboardingEmail;

          const extraItems =
            showActivate || showOnboarding ? (
              <>
                {showActivate ? (
                  <DropdownMenuItem
                    disabled={isProcessing}
                    onClick={() => handleActivateEmployee?.(employee)}
                  >
                    Activate
                  </DropdownMenuItem>
                ) : null}
                {showOnboarding ? (
                  <DropdownMenuItem
                    disabled={isProcessing || !employee.emailAddress}
                    onClick={() => handleSendOnboardingEmail?.(employee)}
                  >
                    Send onboarding email
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : undefined;

          return (
            <DataTableActions
              itemId={itemId}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              currentlyProcessing={currentlyProcessing}
              extraItems={extraItems}
            />
          );
        },
      },
    ];

    return columns;
  }, [
    currentlyProcessing,
    handleActivateEmployee,
    handleDelete,
    handleSendOnboardingEmail,
    handleUpdate,
  ]);
}
