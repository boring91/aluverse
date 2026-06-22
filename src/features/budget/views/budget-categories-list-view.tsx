"use client";

import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { BudgetCategoriesList } from "@/features/budget/components/budget-categories-list";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";

export const BudgetCategoriesListView = () => {
  useTitle("Budget");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("budgetCategories.read");

  if (isPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to budget categories.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Budget</h1>
      </div>

      <BudgetCategoriesList />
    </PageContainer>
  );
};
