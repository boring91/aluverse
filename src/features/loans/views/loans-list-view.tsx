import { PageContainer } from "@/components/page-container";
import { LoansList } from "@/features/loans/components/loans-list";
import { useTitle } from "@/hooks/use-title";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const LoansListView = () => {
  useTitle("Loans");
  const { hasPermission, isPending } = useRbacAccess();

  const canRead = hasPermission("loans.read");

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
          You do not have access to loans.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">Loans</h1>
      </div>

      <LoansList />
    </PageContainer>
  );
};
