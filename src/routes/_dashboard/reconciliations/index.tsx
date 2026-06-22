import { createFileRoute } from "@tanstack/react-router";

import { ReconciliationsView } from "@/features/reconciliations/views/reconciliations-view";

export const Route = createFileRoute("/_dashboard/reconciliations/")({
  component: ReconciliationsView,
});
