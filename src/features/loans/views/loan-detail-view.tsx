"use client";

import { useParams } from "@tanstack/react-router";
import { PageContainer } from "@/components/page-container";
import { NotFound } from "@/components/NotFound";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { useState } from "react";
import { PageLoader } from "@/components/page-loader";
import { LoanDetailHeader } from "@/features/loans/components/loan-detail-header";
import { LoanBasicInfo } from "@/features/loans/components/loan-basic-info";
import { LoanFinancialInfo } from "@/features/loans/components/loan-financial-info";
import { LoanDetailsCard } from "@/features/loans/components/loan-details-card";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";

const LOAN_TYPE_LABELS = {
  lent: "Lent",
  borrowed: "Borrowed",
} as const;

export const LoanDetailView = () => {
  const params = useParams({ strict: false });
  const loanId = params["loanId"] as string;
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("loans.read");
  const canUpdate = hasPermission("loans.update");

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.loans.get.queryOptions(
      {
        id: loanId,
      },
      {
        enabled: canRead,
      },
    ),
  );

  useTitle(
    data ? `${data.partyName} - ${LOAN_TYPE_LABELS[data.type]}` : "Loading",
  );

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
          You do not have access to loans.
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
        <CreateLoan
          open={openCreateSheet}
          onOpenChange={setOpenCreateSheet}
          itemId={data.id}
        />
      ) : null}
      <PageContainer>
        <div className="flex flex-col gap-6">
          <LoanDetailHeader
            loan={data}
            onEditClick={() => setOpenCreateSheet(true)}
            canEdit={canUpdate}
          />

          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Details
              </h2>
              <LoanBasicInfo loan={data} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Financial Summary
              </h2>
              <LoanFinancialInfo loan={data} />
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Payoffs
              </h2>
              <LoanDetailsCard loanId={loanId} />
            </section>
          </div>
        </div>
      </PageContainer>
    </>
  );
};
