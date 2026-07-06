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
      <h1 className="font-bold text-2xl">Employees</h1>

      <PayrollEmployeesList />
    </PageContainer>
  );
}
