"use client";

import { PageLoader } from "@/components/page-loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { BudgetCategoryAllocationsList } from "./budget-category-allocations-list";

export const BudgetCategoryAllocationsCard = ({
  budgetCategoryId,
}: {
  budgetCategoryId: string;
}) => {
  const { hasPermission, isPending } = useRbacAccess();
  const canRead = hasPermission("budgetCategoryAllocations.read");

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Allocations</CardTitle>
        <CardDescription>
          View and manage all allocations for this budget category
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <PageLoader variant="inline" />
        ) : canRead ? (
          <BudgetCategoryAllocationsList budgetCategoryId={budgetCategoryId} />
        ) : (
          <p className="text-muted-foreground">
            You do not have access to budget category allocations.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
