"use client";

import {
  DataTableActions,
  DataTableColumnHeader,
} from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { employmentTypeLabels } from "@/lib/constants";
import { formatDateString } from "@/lib/shared-utils";
import { cn } from "@/lib/client-utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangleIcon } from "lucide-react";
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

type CasualConversionWarning = {
  level: "approaching" | "eligible";
  monthsElapsed: number;
};

// Under Australian law, casual employees who have worked for 12 months of regular
// and systematic service must be offered conversion to permanent employment.
// Flag casuals approaching (>= 10 months) or already past (>= 12 months) that mark.
function getCasualConversionWarning(
  employee: PayrollEmployee
): CasualConversionWarning | null {
  if (employee.employmentType !== "Casual" || employee.status !== "Active") {
    return null;
  }

  if (!employee.startDate) {
    return null;
  }

  const startDate = new Date(employee.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const now = new Date();
  const monthsElapsed =
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth()) +
    (now.getDate() >= startDate.getDate() ? 0 : -1);

  if (monthsElapsed >= 12) {
    return { level: "eligible", monthsElapsed };
  }

  if (monthsElapsed >= 10) {
    return { level: "approaching", monthsElapsed };
  }

  return null;
}

function CasualConversionBadge({
  warning,
}: {
  warning: CasualConversionWarning;
}) {
  const isEligible = warning.level === "eligible";

  return (
    <Tooltip>
      <TooltipTrigger>
        <AlertTriangleIcon
          className={cn(
            "size-4 shrink-0",
            isEligible ? "text-rose-500" : "text-amber-500"
          )}
        />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {isEligible
          ? `This casual has worked for ${warning.monthsElapsed} months and is eligible for conversion to permanent employment. Australian law requires you to offer conversion.`
          : `This casual has worked for ${warning.monthsElapsed} months and is approaching the 12-month conversion threshold. Start planning to offer permanent conversion.`}
      </TooltipContent>
    </Tooltip>
  );
}

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
          const warning = getCasualConversionWarning(row.original);

          return (
            <div className="flex items-center gap-2">
              <p>{formatDateString(row.original.startDate)}</p>
              {warning ? <CasualConversionBadge warning={warning} /> : null}
            </div>
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
