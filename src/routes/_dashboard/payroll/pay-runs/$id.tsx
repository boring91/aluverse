import { createFileRoute } from "@tanstack/react-router";

import { PayrollPayRunDetailView } from "@/features/payroll/views/payroll-pay-run-detail-view";

export const Route = createFileRoute("/_dashboard/payroll/pay-runs/$id")({
  component: PayrollPayRunDetailView,
});
