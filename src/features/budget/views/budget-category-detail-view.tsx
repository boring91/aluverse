import { useParams } from "@tanstack/react-router";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { NotFound } from "@/components/NotFound";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BudgetCategoryAllocationsCard } from "../components/budget-category-allocations-card";
import { BudgetCategoryBasicInfo } from "../components/budget-category-basic-info";
import { BudgetCategoryDetailHeader } from "../components/budget-category-detail-header";
import { CreateBudgetCategory } from "../components/create-budget-category";

export const BudgetCategoryDetailView = () => {
  const params = useParams({ strict: false });
  const budgetCategoryId = params["budgetCategoryId"] as string;
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("budgetCategories.read");
  const canUpdate = hasPermission("budgetCategories.update");

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.budgetCategories.get.queryOptions(
      { id: budgetCategoryId },
      {
        enabled: canRead,
      },
    ),
  );

  useTitle(data ? data.name : "Loading");

  const [openCreateSheet, setOpenCreateSheet] = useState(false);

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
          You do not have access to budget categories.
        </p>
      </PageContainer>
    );
  }

  if (!data) {
    return <NotFound />;
  }

  return (
    <>
      {canUpdate ? (
        <CreateBudgetCategory
          open={openCreateSheet}
          onOpenChange={setOpenCreateSheet}
          itemId={data.id}
        />
      ) : null}
      <PageContainer>
        <div className="flex flex-col gap-6">
          <BudgetCategoryDetailHeader
            category={data}
            onEditClick={() => setOpenCreateSheet(true)}
            canEdit={canUpdate}
          />

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Details
            </h2>
            <BudgetCategoryBasicInfo category={data} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Allocations
            </h2>
            <BudgetCategoryAllocationsCard
              budgetCategoryId={budgetCategoryId}
            />
          </section>
        </div>
      </PageContainer>
    </>
  );
};
