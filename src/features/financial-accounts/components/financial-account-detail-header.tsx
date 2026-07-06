import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import type { AppRouter } from "@/trpc/router";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

type FinancialAccount =
  inferRouterOutputs<AppRouter>["financialAccounts"]["get"];

export const FinancialAccountDetailHeader = ({
  account,
}: {
  account: FinancialAccount;
}) => {
  return (
    <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" asChild>
        <Link to="/financial-accounts">
          <ArrowLeft className="rtl:-scale-x-100" />
        </Link>
      </Button>
      <div className="font-bold grow flex flex-col gap-1">
        <h1 className="text-2xl">{account.name}</h1>
        <span className="font-mono text-muted-foreground">
          {formatCurrency(account.balance)}
        </span>
      </div>
    </div>
  );
};
