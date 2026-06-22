import { createFileRoute } from "@tanstack/react-router";

import { LoansListView } from "@/features/loans/views/loans-list-view";

export const Route = createFileRoute("/_dashboard/loans/")({
  component: LoansListView,
});
