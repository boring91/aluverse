"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

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
        <Link href="/financial-accounts">
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
