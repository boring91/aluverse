import { createFileRoute } from "@tanstack/react-router";

import { BudgetCategoriesListView } from "@/features/budget/views/budget-categories-list-view";

export const Route = createFileRoute("/_dashboard/budgets/")({
  component: BudgetCategoriesListView,
});
