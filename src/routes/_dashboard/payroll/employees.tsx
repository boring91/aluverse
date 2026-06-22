import { createFileRoute } from "@tanstack/react-router";

import { PayrollEmployeesView } from "@/features/payroll/views/payroll-employees-view";

export const Route = createFileRoute("/_dashboard/payroll/employees")({
  component: PayrollEmployeesView,
});
