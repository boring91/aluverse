import { createFileRoute } from "@tanstack/react-router";

import { PayrollSettingsView } from "@/features/payroll/views/payroll-settings-view";

export const Route = createFileRoute("/_dashboard/payroll/settings")({
  component: PayrollSettingsView,
});
