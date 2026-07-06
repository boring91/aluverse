import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";
import { PayrollPaySchedulesList } from "../components/payroll-pay-schedules-list";

export function PayrollPaySchedulesView() {
  useTitle("Payroll Pay Schedules");

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
          You do not have access to payroll pay schedules.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="font-bold text-2xl">Pay schedules</h1>

      <PayrollPaySchedulesList />
    </PageContainer>
  );
}
