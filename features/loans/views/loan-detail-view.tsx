"use client";

import { PageContainer } from "@/components/page-container";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { notFound, useParams } from "next/navigation";
import { CreateLoan } from "@/features/loans/components/create-loan";
import { useState } from "react";
import { PageLoader } from "@/components/page-loader";
import { LoanDetailHeader } from "@/features/loans/components/loan-detail-header";
import { LoanBasicInfo } from "@/features/loans/components/loan-basic-info";
import { LoanFinancialInfo } from "@/features/loans/components/loan-financial-info";
import { LoanDetailsCard } from "@/features/loans/components/loan-details-card";

const LOAN_TYPE_LABELS = {
  lent: "Lent",
  borrowed: "Borrowed",
} as const;

export const LoanDetailView = () => {
  const params = useParams();
  const loanId = params["loanId"] as string;

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.loans.get.queryOptions({
      id: loanId,
    })
  );

  useTitle(
    data ? `${data.partyName} - ${LOAN_TYPE_LABELS[data.type]}` : "Loading"
  );

  const [openCreateSheet, setOpenCreateSheet] = useState(false);

  if (isLoading) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!data) {
    notFound();
    return null;
  }

  return (
    <>
      {openCreateSheet && (
        <CreateLoan
          open={openCreateSheet}
          onOpenChange={setOpenCreateSheet}
          itemId={data.id}
        />
      )}
      <PageContainer>
        <div className="flex flex-col gap-6">
          <LoanDetailHeader
            loan={data}
            onEditClick={() => setOpenCreateSheet(true)}
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
