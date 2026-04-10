"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import { DataTable, useDataTable } from "@/components/data-table";
import { PageLoader } from "@/components/page-loader";
import { useConfirm } from "@/lib/confirm-context";
import { useTRPC } from "@/trpc/client";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { CreatePayrollEmployee } from "./create-payroll-employee";
import { usePayrollEmployeesColumns } from "../hooks/use-payroll-employees-columns";

export function PayrollEmployeesList() {
  const trpc = useTRPC();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();
  const { hasPermission, isPending: isAccessPending } = useRbacAccess();
  const dataTable = useDataTable({
    pageSize: 100,
  });

  const canRead = hasPermission("payroll.read");
  const canWrite = hasPermission("payroll.write");
  const [itemId, setItemId] = useQueryState("itemId", parseAsString);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<Set<string>>(
    new Set()
  );

  const { data: employees } = useQuery(
    trpc.payroll.listEmployees.queryOptions(undefined, {
      enabled: canRead,
    })
  );

  const deleteMutation = useMutation(
    trpc.payroll.deleteEmployee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.payroll.listEmployees.queryOptions()
        );
        toast.success("Employee deleted successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, input) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(input.id.toString());
          return next;
        });
      },
    })
  );

  const activateMutation = useMutation(
    trpc.payroll.activateEmployee.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.payroll.listEmployees.queryOptions()
        );
        toast.success("Employee activated successfully.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
      onSettled: (_, __, input) => {
        setCurrentlyProcessing((current) => {
          const next = new Set(current);
          next.delete(input.id.toString());
          return next;
        });
      },
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

  const handleUpdate = (targetItemId: string) => {
    if (!canWrite) {
      return;
    }
    setItemId(targetItemId);
  };

  const handleDelete = (targetItemId: string) => {
    if (!canWrite) {
      return;
    }

    const employee = employees?.items.find(
      (item) => item.id.toString() === targetItemId
    );
    const fullName =
      `${employee?.firstName ?? ""} ${employee?.surname ?? ""}`.trim() ||
      "this employee";

    confirm({
      title: "Delete employee",
      description: `Are you sure you want to delete ${fullName}? This permanently removes the employee from the database.`,
      onConfirm: () => {
        setCurrentlyProcessing((current) => new Set(current).add(targetItemId));
        deleteMutation.mutate({
          id: Number(targetItemId),
        });
      },
    });
  };

  const handleSendOnboardingEmail = (
    employee: NonNullable<typeof employees>["items"][number]
  ) => {
    if (!canWrite || !employee.emailAddress) {
      return;
    }

    const processingId = employee.id.toString();
    setCurrentlyProcessing((current) => new Set(current).add(processingId));
    onboardingMutation.mutate(
      {
        employeeId: employee.id,
        firstName: employee.firstName ?? undefined,
        surname: employee.surname ?? undefined,
        email: employee.emailAddress,
        mobile: employee.mobilePhone ?? undefined,
      },
      {
        onSettled: () => {
          setCurrentlyProcessing((current) => {
            const next = new Set(current);
            next.delete(processingId);
            return next;
          });
        },
      }
    );
  };

  const handleActivateEmployee = (
    employee: NonNullable<typeof employees>["items"][number]
  ) => {
    if (!canWrite) {
      return;
    }

    setCurrentlyProcessing((current) =>
      new Set(current).add(employee.id.toString())
    );
    activateMutation.mutate({ id: employee.id });
  };

  const columns = usePayrollEmployeesColumns(
    currentlyProcessing,
    canWrite ? handleUpdate : undefined,
    canWrite ? handleDelete : undefined,
    canWrite ? handleSendOnboardingEmail : undefined,
    canWrite ? handleActivateEmployee : undefined
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
          open={dataTable.openCreateSheet || !!itemId}
          onOpenChange={(value) => {
            if (value) {
              dataTable.setOpenCreateSheet(true);
              return;
            }

            setItemId(null);
            dataTable.setOpenCreateSheet(false);
          }}
          itemId={itemId}
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
