import { createFileRoute } from "@tanstack/react-router";

import { PayrollPaySchedulesView } from "@/features/payroll/views/payroll-pay-schedules-view";

export const Route = createFileRoute("/_dashboard/payroll/pay-schedules")({
  component: PayrollPaySchedulesView,
});
