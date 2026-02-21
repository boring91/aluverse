"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";
import { ArrowLeft, Edit3Icon } from "lucide-react";
import Link from "next/link";

type BudgetCategory = inferRouterOutputs<AppRouter>["budgetCategories"]["get"];

export const BudgetCategoryDetailHeader = ({
  category,
  onEditClick,
  canEdit,
}: {
  category: BudgetCategory;
  onEditClick: () => void;
  canEdit: boolean;
}) => {
  return (
    <div className="flex flex-col gap-4 border-b pb-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/budgets">
            <ArrowLeft className="rtl:-scale-x-100" />
          </Link>
        </Button>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold leading-tight">
              {category.name}
            </h1>
            <Badge variant={category.includingGst ? "default" : "secondary"}>
              {category.includingGst ? "GST included" : "GST excluded"}
            </Badge>
          </div>
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
