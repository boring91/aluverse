"use client";

import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";
import { PayrollPayRunsList } from "../components/payroll-pay-runs-list";

export function PayrollPayRunsView() {
  useTitle("Payroll Pay Runs");

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
          You do not have access to payroll pay runs.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-bold text-2xl">Pay runs</h1>

      <PayrollPayRunsList />
    </PageContainer>
  );
}
