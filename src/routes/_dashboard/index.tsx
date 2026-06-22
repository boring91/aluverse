import { createFileRoute } from "@tanstack/react-router";

import { DashboardView } from "@/features/dashboard/views/dashboard-view";

export const Route = createFileRoute("/_dashboard/")({
  component: DashboardView,
});
