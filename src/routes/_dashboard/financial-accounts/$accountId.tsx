import { createFileRoute } from "@tanstack/react-router";

import { FinancialAccountDetailView } from "@/features/financial-accounts/views/financial-account-detail-view";

export const Route = createFileRoute(
  "/_dashboard/financial-accounts/$accountId",
)({
  component: FinancialAccountDetailView,
});
