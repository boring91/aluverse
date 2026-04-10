"use client";

import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { PayrollEmployeesList } from "@/features/payroll/components/payroll-employees-list";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";

export function PayrollEmployeesView() {
  useTitle("Payroll Employees");

  const { hasPermission, isPending } = useRbacAccess();
  const canRead = hasPermission("payroll.read");

  if (isPending) {
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
          You do not have access to payroll employees.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl">Payroll employees</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          Create employees in Aluverse, then generate a self-service onboarding
          link so Employment Hero collects TFN, super, and bank details
          directly.
        </p>
      </div>

      <PayrollEmployeesList />
    </PageContainer>
  );
}
