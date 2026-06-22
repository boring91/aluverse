import { createFileRoute } from "@tanstack/react-router";

import { PayrollPayRunsView } from "@/features/payroll/views/payroll-pay-runs-view";

export const Route = createFileRoute("/_dashboard/payroll/pay-runs/")({
  component: PayrollPayRunsView,
});
