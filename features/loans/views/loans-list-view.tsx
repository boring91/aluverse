"use client";

import { PageContainer } from "@/components/page-container";
import { LoansList } from "@/features/loans/components/loans-list";
import { useTitle } from "@/hooks/use-title";

export const LoansListView = () => {
  useTitle("Loans");

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Loans</h1>
      </div>

      <LoansList />
    </PageContainer>
  );
};
