"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Edit3Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

export const LoanDetailHeader = ({
  loan,
  onEditClick,
}: {
  loan: Loan;
  onEditClick: () => void;
}) => {
  const tc = useTranslations("Common");
  const t = useTranslations("Loans");

  return (
    <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/loans">
            <ArrowLeft className="rtl:-scale-x-100" />
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-tight">
              {loan.partyName}
            </h1>
            <Badge variant={loan.type === "lent" ? "default" : "secondary"}>
              {t(loan.type)}
            </Badge>
          </div>
          {loan.notes && (
            <p className="text-sm text-muted-foreground">{loan.notes}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onEditClick}>
          <Edit3Icon className="mr-2 size-4" />
          {tc("edit")}
        </Button>
      </div>
    </div>
  );
};
