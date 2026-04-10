"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inferRouterOutputs } from "@trpc/server";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeft,
  BanknoteIcon,
  CalendarIcon,
  CoinsIcon,
  DollarSignIcon,
  PiggyBankIcon,
  RefreshCwIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DataTable,
  DataTableColumnHeader,
  useDataTable,
} from "@/components/data-table";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useConfirm } from "@/lib/confirm-context";
import { formatDateString } from "@/lib/shared-utils";
import { formatCurrency } from "@/lib/utils";
import { useTitle } from "@/hooks/use-title";
import { AppRouter } from "@/trpc/routers/_app";
import { useTRPC } from "@/trpc/client";
import { PayrollPayRunBankDetailsModal } from "../components/payroll-pay-run-bank-details-modal";

type PayRunDetails =
  inferRouterOutputs<AppRouter>["payroll"]["getPayRunDetails"];
type PayRunEmployee = PayRunDetails["employees"][number];

const STATUS_VARIANTS: Record<
  PayRunDetails["payRun"]["status"],
  "default" | "outline" | "secondary"
> = {
  Draft: "outline",
  Calculated: "secondary",
  Finalized: "default",
};

function formatPeriod(
  payPeriodStarting: string | null | undefined,
  payPeriodEnding: string | null | undefined
) {
  const start = formatDateString(payPeriodStarting);
  const end = formatDateString(payPeriodEnding);

  if (start === "—" && end === "—") {
    return "—";
  }

  return `${start} — ${end}`;
}

function formatCents(value: number | null) {
  return value == null ? "—" : formatCurrency(value);
}

function formatHours(value: number | null) {
  if (value == null) {
    return "—";
  }

  return `${value.toFixed(2)} h`;
}

export function PayrollPayRunDetailView() {
  const params = useParams<{ id: string }>();
  const payRunId = Number(params.id);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { hasPermission, isPending: isAccessPending } = useRbacAccess();
  const canRead = hasPermission("payroll.read");
  const canWrite = hasPermission("payroll.write");
  const dataTable = useDataTable({ pageSize: 100 });
  const [bankDetailsEmployee, setBankDetailsEmployee] =
    useState<PayRunEmployee | null>(null);

  const { data, isLoading, isError } = useQuery(
    trpc.payroll.getPayRunDetails.queryOptions(
      { payRunId },
      {
        enabled: canRead && Number.isFinite(payRunId),
      }
    )
  );

  const { data: stpStatus, refetch: refetchStpStatus } = useQuery(
    trpc.payroll.getStpStatus.queryOptions(
      { payRunId },
      {
        enabled: canRead && data?.payRun.isFinalized === true,
      }
    )
  );

  useTitle(
    data
      ? `Pay run ${formatDateString(data.payRun.payPeriodEnding)}`
      : "Pay run"
  );

  const invalidatePayRunDetails = async () => {
    await Promise.all([
      queryClient.invalidateQueries(
        trpc.payroll.getPayRunDetails.queryOptions({ payRunId })
      ),
      queryClient.invalidateQueries(trpc.payroll.listPayRuns.queryOptions({})),
    ]);
  };

  const calculateMutation = useMutation(
    trpc.payroll.calculatePayRun.mutationOptions({
      onSuccess: async () => {
        await invalidatePayRunDetails();
        toast.success("Pay run calculated successfully.");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const finalizeMutation = useMutation(
    trpc.payroll.finalizePayRun.mutationOptions({
      onSuccess: async () => {
        await invalidatePayRunDetails();
        toast.success("Pay run finalized successfully.");
      },
      onError: (error) => toast.error(error.message),
    })
  );

  const columns = useMemo<ColumnDef<PayRunEmployee>[]>(
    () => [
      {
        id: "employeeName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Employee" />
        ),
        accessorKey: "employeeName",
        cell: ({ row }) => (
          <p className="font-medium">
            {row.original.employeeName ?? `Employee ${row.original.employeeId}`}
          </p>
        ),
      },
      {
        id: "totalHours",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Hours" />
        ),
        accessorKey: "totalHours",
        cell: ({ row }) => <p>{formatHours(row.original.totalHours)}</p>,
      },
      {
        id: "grossEarningsInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Gross" />
        ),
        accessorKey: "grossEarningsInCents",
        cell: ({ row }) => (
          <p className="font-mono">
            {formatCents(row.original.grossEarningsInCents)}
          </p>
        ),
      },
      {
        id: "paygWithholdingInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="PAYG" />
        ),
        accessorKey: "paygWithholdingInCents",
        cell: ({ row }) => (
          <p className="font-mono">
            {formatCents(row.original.paygWithholdingInCents)}
          </p>
        ),
      },
      {
        id: "superContributionInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Super" />
        ),
        accessorKey: "superContributionInCents",
        cell: ({ row }) => (
          <p className="font-mono">
            {formatCents(row.original.superContributionInCents)}
          </p>
        ),
      },
      {
        id: "netEarningsInCents",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Net" />
        ),
        accessorKey: "netEarningsInCents",
        cell: ({ row }) => (
          <p className="font-mono font-medium">
            {formatCents(row.original.netEarningsInCents)}
          </p>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBankDetailsEmployee(row.original)}
            >
              Bank details
            </Button>
          </div>
        ),
      },
    ],
    [setBankDetailsEmployee]
  );

  const tableData = data
    ? {
        items: data.employees,
        count: data.employees.length,
        filteredCount: data.employees.length,
      }
    : undefined;

  if (isAccessPending || isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to payroll pay runs.
        </p>
      </PageContainer>
    );
  }

  if (isError || !data) {
    notFound();
    return null;
  }

  const { payRun, grandTotal } = data;
  const isFinalized = payRun.status === "Finalized";
  const canCalculate = canWrite && !isFinalized;
  const canFinalize = canWrite && payRun.status === "Calculated";
  const stpFailed =
    !!stpStatus?.status && /failed|error|rejected/i.test(stpStatus.status);

  const handleCalculate = () => {
    calculateMutation.mutate({ payRunId, employeeHours: [] });
  };

  const handleFinalize = () => {
    confirm({
      title: "Finalize pay run",
      description:
        "Are you sure you want to finalize this pay run? This is irreversible and will trigger STP lodgement.",
      onConfirm: () => {
        finalizeMutation.mutate({ payRunId });
      },
    });
  };

  return (
    <PageContainer>
      <PayrollPayRunBankDetailsModal
        open={!!bankDetailsEmployee}
        onOpenChange={(open) => {
          if (!open) {
            setBankDetailsEmployee(null);
          }
        }}
        payRunId={payRunId}
        employeeId={bankDetailsEmployee?.employeeId ?? null}
        employeeName={bankDetailsEmployee?.employeeName ?? null}
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/payroll/pay-runs">
                <ArrowLeft className="rtl:-scale-x-100" />
              </Link>
            </Button>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold leading-tight">
                  {payRun.payScheduleName ?? `Schedule ${payRun.payScheduleId}`}
                </h1>
                <Badge variant={STATUS_VARIANTS[payRun.status]}>
                  {payRun.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Pay period{" "}
                {formatPeriod(payRun.payPeriodStarting, payRun.payPeriodEnding)}{" "}
                &mdash; paid {formatDateString(payRun.datePaid)}
              </p>
            </div>
          </div>

          {canCalculate || canFinalize ? (
            <div className="flex items-center gap-3">
              {canCalculate ? (
                <Button
                  variant="outline"
                  disabled={calculateMutation.isPending}
                  onClick={handleCalculate}
                >
                  Calculate
                </Button>
              ) : null}
              {canFinalize ? (
                <Button
                  disabled={finalizeMutation.isPending}
                  onClick={handleFinalize}
                >
                  Finalize
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Pay period
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon size={16} />
                    Period
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                  {formatPeriod(
                    payRun.payPeriodStarting,
                    payRun.payPeriodEnding
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon size={16} />
                    Date paid
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                  {formatDateString(payRun.datePaid)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon size={16} />
                    Employees
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-lg font-semibold">
                  {grandTotal.numberOfEmployees} &middot;{" "}
                  {formatHours(grandTotal.totalHours)}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Financial summary
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSignIcon size={16} />
                    Gross
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold">
                  {formatCents(grandTotal.grossEarningsInCents)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CoinsIcon size={16} />
                    PAYG withheld
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-rose-500">
                  {formatCents(grandTotal.paygWithholdingInCents)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PiggyBankIcon size={16} />
                    Super
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-amber-500">
                  {formatCents(grandTotal.superContributionInCents)}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BanknoteIcon size={16} />
                    Net
                  </CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-xl font-semibold text-emerald-500">
                  {formatCents(grandTotal.netEarningsInCents)}
                </CardContent>
              </Card>
            </div>
          </section>

          {isFinalized ? (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Single Touch Payroll
              </h2>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                      Lodgement status
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => refetchStpStatus()}
                    >
                      <RefreshCwIcon />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={stpFailed ? "destructive" : "default"}>
                      {stpStatus?.status ?? "Unknown"}
                    </Badge>
                    {stpStatus?.jobId ? (
                      <span className="text-muted-foreground text-xs font-mono">
                        Job {stpStatus.jobId}
                      </span>
                    ) : null}
                  </div>
                  {stpFailed && stpStatus?.detail ? (
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertTitle>STP lodgement failed</AlertTitle>
                      <AlertDescription>{stpStatus.detail}</AlertDescription>
                    </Alert>
                  ) : null}
                </CardContent>
              </Card>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Employees
            </h2>
            <DataTable
              columns={columns}
              data={tableData}
              pagination={dataTable.pagination}
              setPagination={dataTable.setPagination}
            />
          </section>
        </div>
      </div>
    </PageContainer>
  );
}
