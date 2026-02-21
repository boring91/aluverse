"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppRouter } from "@/trpc/routers/_app";
import { inferRouterOutputs } from "@trpc/server";

type BudgetCategory = inferRouterOutputs<AppRouter>["budgetCategories"]["get"];

export const BudgetCategoryBasicInfo = ({
  category,
}: {
  category: BudgetCategory;
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Name</CardTitle>
        </CardHeader>
        <CardContent className="font-semibold">{category.name}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            GST mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={category.includingGst ? "default" : "secondary"}>
            {category.includingGst ? "Including GST" : "Excluding GST"}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};
