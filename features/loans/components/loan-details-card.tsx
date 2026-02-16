"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PayoffsList } from "@/features/loans/components/payoffs-list";

export const LoanDetailsCard = ({ loanId }: { loanId: string }) => {
  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Payoffs</CardTitle>
        <CardDescription>
          View and manage all payoffs for this loan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PayoffsList loanId={loanId} />
      </CardContent>
    </Card>
  );
};
