import { useMemo, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DataTable,
  DataTableFilters,
  EnumFilter,
  useDataTable,
  useDataTableFilters,
} from "@/components/data-table";
import { PageLoader } from "@/components/page-loader";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useConfirm } from "@/lib/confirm-context";
import { useTRPC } from "@/trpc";
import type { AppRouter } from "@/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { payrollPayRunFiltersSchema } from "../schemas/payroll.shared-schema";
import { CalculatePayrollPayRun } from "./calculate-payroll-pay-run";
import { CreatePayrollPayRun } from "./create-payroll-pay-run";
import { usePayrollPayRunsColumns } from "../hooks/use-payroll-pay-runs-columns";

type PayrollPayRun =
  inferRouterOutputs<AppRouter>["payroll"]["listPayRuns"]["items"][number];

export function PayrollPayRunsList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { hasPermission, isPending: isAccessPending } = useRbacAccess();
  const canRead = hasPermission("payroll.read");
  const canWrite = hasPermission("payroll.write");
  const dataTable = useDataTable({
    pageSize: 50,
  });
  const { filter, reset, isActive, raw } = useDataTableFilters(
    payrollPayRunFiltersSchema,
  );
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set(),
  );
  const [payRunForHours, setPayRunForHours] = useState<PayrollPayRun | null>(
    null,
  );

  const { data: paySchedules } = useQuery(
    trpc.payroll.listPaySchedules.queryOptions(undefined, {
      enabled: canRead,
    }),
  );
  const { data: employees } = useQuery(
    trpc.payroll.listEmployees.queryOptions(undefined, {
      enabled: canRead,
    }),
  );
  const { data: payRuns } = useQuery(
    trpc.payroll.listPayRuns.queryOptions(
      {
        payScheduleId: raw.payScheduleId
          ? Number(raw.payScheduleId)
          : undefined,
      },
      {
        enabled: canRead,
        placeholderData: keepPreviousData,
      },
    ),
  );

  const invalidatePayRuns = async () => {
    await Promise.all([
      queryClient.invalidateQueries(trpc.payroll.listPayRuns.queryOptions({})),
      queryClient.invalidateQueries(
        trpc.payroll.listPayRuns.queryOptions({
          payScheduleId: raw.payScheduleId
            ? Number(raw.payScheduleId)
            : undefined,
        }),
      ),
    ]);
  };

  const calculateAction = useMutation(
    trpc.payroll.calculatePayRun.mutationOptions({
      onSuccess: async (_, { payRunId }) => {
        await Promise.all([
          invalidatePayRuns(),
          queryClient.invalidateQueries(
            trpc.payroll.getPayRunEmployeeHours.queryOptions({
              payRunId,
            }),
          ),
        ]);
        toast.success("Pay run calculated successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, input) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(input.payRunId.toString());
          return next;
        });
      },
    }),
  );

  const finalizeAction = useMutation(
    trpc.payroll.finalizePayRun.mutationOptions({
      onSuccess: async () => {
        await invalidatePayRuns();
        toast.success("Pay run finalized successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, input) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(input.payRunId.toString());
          return next;
        });
      },
    }),
  );

  const deleteAction = useMutation(
    trpc.payroll.deletePayRun.mutationOptions({
      onSuccess: async () => {
        await invalidatePayRuns();
        toast.success("Pay run deleted successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, input) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(input.payRunId.toString());
          return next;
        });
      },
    }),
  );

  const getCasualEmployeesForPayRun = (payRun: PayrollPayRun) => {
    return (employees?.items ?? []).filter((employee) => {
      if (employee.status === "Terminated") {
        return false;
      }

      if (employee.employmentType !== "Casual") {
        return false;
      }

      return employee.paySchedule === payRun.payScheduleName;
    });
  };

  const handleCalculate = (payRun: PayrollPayRun) => {
    if (!canWrite) {
      return;
    }

    const casualEmployees = getCasualEmployeesForPayRun(payRun);

    if (casualEmployees.length > 0) {
      setPayRunForHours(payRun);
      return;
    }

    setCurrentlyProcessing((current) =>
      new Set(current).add(payRun.id.toString()),
    );
    calculateAction.mutate({
      payRunId: payRun.id,
      employeeHours: [],
    });
  };

  const handleFinalize = (payRun: PayrollPayRun) => {
    if (!canWrite) {
      return;
    }

    confirm({
      title: "Finalize pay run",
      description:
        "Are you sure you want to finalize this pay run? This is irreversible and will trigger STP.",
      onConfirm: () => {
        setCurrentlyProcessing((current) =>
          new Set(current).add(payRun.id.toString()),
        );
        finalizeAction.mutate({
          payRunId: payRun.id,
        });
      },
    });
  };

  const handleCalculateWithHours = async (input: {
    payRunId: number;
    employeeHours: {
      employeeId: number;
      units: number;
    }[];
  }) => {
    setCurrentlyProcessing((current) =>
      new Set(current).add(input.payRunId.toString()),
    );

    try {
      await calculateAction.mutateAsync(input);
    } finally {
      setPayRunForHours(null);
    }
  };

  const handleDelete = (targetItemId: string) => {
    if (!canWrite) {
      return;
    }

    const payRun = payRuns?.items.find(
      (item) => item.id.toString() === targetItemId,
    );

    if (!payRun || payRun.status === "Finalized") {
      return;
    }

    confirm({
      title: "Delete pay run",
      description:
        "Are you sure you want to delete this pay run? This removes the draft from the database.",
      onConfirm: () => {
        setCurrentlyProcessing((current) => new Set(current).add(targetItemId));
        deleteAction.mutate({
          payRunId: Number(targetItemId),
        });
      },
    });
  };

  const columns = usePayrollPayRunsColumns(
    currentlyProcessing,
    canWrite ? handleCalculate : undefined,
    canWrite ? handleFinalize : undefined,
    canWrite ? handleDelete : undefined,
  );

  const payScheduleItems = useMemo(() => {
    return (paySchedules ?? []).map((paySchedule) => ({
      value: paySchedule.id.toString(),
      label: paySchedule.frequency
        ? `${paySchedule.name} (${paySchedule.frequency})`
        : (paySchedule.name ?? `Schedule ${paySchedule.id}`),
    }));
  }, [paySchedules]);

  const modalEmployees = payRunForHours
    ? getCasualEmployeesForPayRun(payRunForHours)
    : [];

  if (isAccessPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to payroll pay runs.
      </p>
    );
  }

  return (
    <>
      {canWrite ? (
        <>
          <CreatePayrollPayRun
            open={dataTable.openCreateSheet}
            onOpenChange={dataTable.setOpenCreateSheet}
            activePayScheduleId={
              raw.payScheduleId ? Number(raw.payScheduleId) : null
            }
          />

          <CalculatePayrollPayRun
            open={!!payRunForHours}
            onOpenChange={(open) => {
              if (!open) {
                setPayRunForHours(null);
              }
            }}
            payRun={payRunForHours}
            employees={modalEmployees}
            onSubmit={handleCalculateWithHours}
          />
        </>
      ) : null}

      <DataTable
        columns={columns}
        data={payRuns}
        pagination={dataTable.pagination}
        setPagination={dataTable.setPagination}
        setOpenCreateSheet={canWrite ? dataTable.setOpenCreateSheet : undefined}
        filtersSlot={
          <DataTableFilters onReset={reset} hasActiveFilters={isActive}>
            <EnumFilter
              label="Pay schedule"
              control={filter.payScheduleId}
              options={payScheduleItems}
              placeholder="All pay schedules"
            />
          </DataTableFilters>
        }
      />
    </>
  );
}
