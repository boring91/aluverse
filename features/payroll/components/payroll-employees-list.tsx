"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { DataTable, useDataTable } from "@/components/data-table";
import { PageLoader } from "@/components/page-loader";
import { useTRPC } from "@/trpc/client";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { CreatePayrollEmployee } from "./create-payroll-employee";
import { usePayrollEmployeesColumns } from "../hooks/use-payroll-employees-columns";

export function PayrollEmployeesList() {
  const trpc = useTRPC();
  const { hasPermission, isPending: isAccessPending } = useRbacAccess();
  const dataTable = useDataTable({
    pageSize: 100,
  });

  const canRead = hasPermission("payroll.read");
  const canWrite = hasPermission("payroll.write");
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<number>>(
    new Set()
  );

  const { data: employees } = useQuery(
    trpc.payroll.listEmployees.queryOptions(undefined, {
      enabled: canRead,
    })
  );

  const onboardingMutation = useMutation(
    trpc.payroll.sendOnboardingEmail.mutationOptions({
      onSuccess: ({ email }) => {
        toast.success(`Onboarding email sent to ${email}.`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleSendOnboardingEmail = (
    employee: NonNullable<typeof employees>["items"][number]
  ) => {
    if (!canWrite || !employee.emailAddress) {
      return;
    }

    setCurrentlyProcessing((current) => new Set(current).add(employee.id));
    onboardingMutation.mutate(
      {
        firstName: employee.firstName ?? undefined,
        surname: employee.surname ?? undefined,
        email: employee.emailAddress,
        mobile: employee.mobilePhone ?? undefined,
      },
      {
        onSettled: () => {
          setCurrentlyProcessing((current) => {
            const next = new Set(current);
            next.delete(employee.id);
            return next;
          });
        },
      }
    );
  };

  const columns = usePayrollEmployeesColumns(
    canWrite,
    currentlyProcessing,
    canWrite ? handleSendOnboardingEmail : undefined
  );

  if (isAccessPending) {
    return <PageLoader variant="inline" />;
  }

  if (!canRead) {
    return (
      <p className="text-muted-foreground">
        You do not have access to payroll.
      </p>
    );
  }

  return (
    <>
      {canWrite ? (
        <CreatePayrollEmployee
          open={dataTable.openCreateSheet}
          onOpenChange={dataTable.setOpenCreateSheet}
        />
      ) : null}

      <DataTable
        columns={columns}
        data={employees}
        pagination={dataTable.pagination}
        setPagination={dataTable.setPagination}
        setOpenCreateSheet={canWrite ? dataTable.setOpenCreateSheet : undefined}
      />
    </>
  );
}
