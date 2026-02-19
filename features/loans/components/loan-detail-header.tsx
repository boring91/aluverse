"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit3Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type Loan = inferRouterOutputs<AppRouter>["loans"]["get"];

const LOAN_TYPE_LABELS = {
  lent: "Lent",
  borrowed: "Borrowed",
} as const;

export const LoanDetailHeader = ({
  loan,
  onEditClick,
  canEdit,
}: {
  loan: Loan;
  onEditClick: () => void;
  canEdit: boolean;
}) => {
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
              {LOAN_TYPE_LABELS[loan.type]}
            </Badge>
          </div>
          {loan.notes && (
            <p className="text-sm text-muted-foreground">{loan.notes}</p>
          )}
        </div>
      </div>

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onEditClick}>
            <Edit3Icon className="mr-2 size-4" />
            Edit
          </Button>
        </div>
      ) : null}
    </div>
  );
};
