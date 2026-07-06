import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PayoffsList } from "@/features/loans/components/payoffs-list";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { PageLoader } from "@/components/page-loader";

export const LoanDetailsCard = ({ loanId }: { loanId: string }) => {
  const { hasPermission, isPending } = useRbacAccess();
  const canRead = hasPermission("loanPayoffs.read");

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Payoffs</CardTitle>
        <CardDescription>
          View and manage all payoffs for this loan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <PageLoader variant="inline" />
        ) : canRead ? (
          <PayoffsList loanId={loanId} />
        ) : (
          <p className="text-muted-foreground">
            You do not have access to loan payoffs.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
