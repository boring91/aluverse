import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateString } from "@/lib/shared-utils";
import { useTRPC } from "@/trpc";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type PayrollEmployee =
  inferRouterOutputs<AppRouter>["payroll"]["listEmployees"]["items"][number];

type PayrollPayRun =
  inferRouterOutputs<AppRouter>["payroll"]["listPayRuns"]["items"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payRun: PayrollPayRun | null;
  employees: PayrollEmployee[];
  onSubmit: (input: {
    payRunId: number;
    employeeHours: {
      employeeId: number;
      units: number;
    }[];
  }) => Promise<void>;
};

function getEmployeeLabel(employee: PayrollEmployee) {
  const fullName =
    `${employee.firstName ?? ""} ${employee.surname ?? ""}`.trim() ||
    `Employee ${employee.id}`;

  if (!employee.emailAddress) {
    return fullName;
  }

  return `${fullName} (${employee.emailAddress})`;
}

export function CalculatePayrollPayRun({
  open,
  onOpenChange,
  payRun,
  employees,
  onSubmit,
}: Props) {
  const trpc = useTRPC();
  const [hoursByEmployeeId, setHoursByEmployeeId] = useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingHours, isPending: isHoursPending } = useQuery(
    trpc.payroll.getPayRunEmployeeHours.queryOptions(
      {
        payRunId: payRun?.id ?? 0,
      },
      {
        enabled: open && !!payRun && employees.length > 0,
      },
    ),
  );

  const existingHoursByEmployeeId = useMemo(() => {
    return new Map(
      (existingHours ?? []).map((entry) => [entry.employeeId, entry.units]),
    );
  }, [existingHours]);

  useEffect(() => {
    if (!open || !payRun) {
      return;
    }

    setHoursByEmployeeId(
      Object.fromEntries(
        employees.map((employee) => [
          employee.id,
          existingHoursByEmployeeId.has(employee.id)
            ? String(existingHoursByEmployeeId.get(employee.id))
            : "",
        ]),
      ),
    );
  }, [employees, existingHoursByEmployeeId, open, payRun]);

  const handleSubmit = async () => {
    if (!payRun) {
      return;
    }

    const employeeHours = employees.map((employee) => {
      const rawValue = hoursByEmployeeId[employee.id].trim();

      if (rawValue === "") {
        return {
          employeeId: employee.id,
          units: 0,
        };
      }

      const units = Number(rawValue);

      return {
        employeeId: employee.id,
        units,
      };
    });

    const invalidHours = employeeHours.find(
      (entry) => Number.isNaN(entry.units) || entry.units < 0,
    );

    if (invalidHours) {
      toast.error("Hours must be zero or a positive number.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        payRunId: payRun.id,
        employeeHours,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isSubmitting) {
          return;
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Calculate pay run</DialogTitle>
          <DialogDescription>
            Enter ordinary hours for the casual employees on this pay run before
            recalculating. Leave a value blank to clear it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-lg border p-4 text-sm">
            <p className="font-medium">
              {payRun?.payScheduleName ??
                `Schedule ${payRun?.payScheduleId ?? ""}`}
            </p>
            <p className="text-muted-foreground">
              Period ending {formatDateString(payRun?.payPeriodEnding)}
            </p>
          </div>

          {isHoursPending ? (
            <p className="text-muted-foreground text-sm">
              Loading existing hours…
            </p>
          ) : (
            <div className="grid gap-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="grid gap-2 rounded-lg border p-4 md:grid-cols-[1fr_160px] md:items-end"
                >
                  <div className="grid gap-1">
                    <Label htmlFor={`hours-${employee.id}`}>
                      {getEmployeeLabel(employee)}
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      {employee.primaryPayCategory ?? "Primary pay category"} at{" "}
                      {employee.primaryLocation ?? "default location"}
                    </p>
                  </div>

                  <Input
                    id={`hours-${employee.id}`}
                    min="0"
                    step="0.01"
                    type="number"
                    value={hoursByEmployeeId[employee.id] ?? ""}
                    onChange={(event) => {
                      setHoursByEmployeeId((current) => ({
                        ...current,
                        [employee.id]: event.target.value,
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || isHoursPending}
            onClick={handleSubmit}
          >
            Calculate pay run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
