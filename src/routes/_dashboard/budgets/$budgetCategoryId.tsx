import { createFileRoute } from "@tanstack/react-router";

import { BudgetCategoryDetailView } from "@/features/budget/views/budget-category-detail-view";

export const Route = createFileRoute("/_dashboard/budgets/$budgetCategoryId")({
  component: BudgetCategoryDetailView,
});
