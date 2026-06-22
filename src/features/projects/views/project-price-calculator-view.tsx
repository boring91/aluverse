"use client";

import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { ProjectPriceCalculator } from "@/features/projects/components/project-price-calculator";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";

export const ProjectPriceCalculatorView = () => {
  useTitle("Price Calculator");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("projects.read");

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.projects.getBudgetUnitValue.queryOptions(undefined, {
      enabled: canRead,
    }),
  );

  if (isPending || isLoading) {
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
          You do not have access to the price calculator.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Price Calculator</h1>
      </div>

      <ProjectPriceCalculator budgetUnitValue={data ?? 0} />
    </PageContainer>
  );
};
