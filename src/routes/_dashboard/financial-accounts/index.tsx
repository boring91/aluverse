import { createFileRoute } from "@tanstack/react-router";

import { FinancialAccountsListView } from "@/features/financial-accounts/views/financial-accounts-list-view";

export const Route = createFileRoute("/_dashboard/financial-accounts/")({
  component: FinancialAccountsListView,
});
