"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/client-utils";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { DashboardDateRange } from "../schemas/dashboard.schema";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { useMemo } from "react";

type Props = {
  dateRange: DashboardDateRange;
};

export const BudgetTable = ({ dateRange }: Props) => {
  const t = useTranslations("FinancialAccounts");
  const tc = useTranslations("Common");

  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.dashboard.budgetItemsSpending.queryOptions(dateRange)
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  const totals = useMemo(() => {
    return (data || []).reduce(
      (acc, item) => ({
        allocated: acc.allocated + item.allocated,
        spent: acc.spent + item.spent,
        remaining: acc.remaining + item.remaining,
      }),
      { allocated: 0, spent: 0, remaining: 0 }
    );
  }, [data]);

  const totalRemainingPercent =
    totals.allocated > 0 ? totals.remaining / totals.allocated : 0;

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Budget spending</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining$</TableHead>
                  <TableHead className="text-right">Remaining%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {tc("noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {data.map((item) => {
                      const isNegative = item.remaining < 0;

                      return (
                        <TableRow key={item.category}>
                          <TableCell className="font-medium">
                            {t(item.category)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.allocated)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(-item.spent)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium",
                              isNegative && "text-destructive",
                              !isNegative && "text-primary"
                            )}
                          >
                            {formatCurrency(item.remaining)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-medium",
                              isNegative && "text-destructive",
                              !isNegative && "text-primary"
                            )}
                          >
                            {formatPercent(item.remainingPercent)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="font-semibold bg-muted/50">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(totals.allocated)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(-totals.spent)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          totals.remaining < 0 && "text-destructive",
                          totals.remaining >= 0 && "text-primary"
                        )}
                      >
                        {formatCurrency(totals.remaining)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right",
                          totalRemainingPercent < 0 && "text-destructive",
                          totalRemainingPercent >= 0 && "text-primary"
                        )}
                      >
                        {formatPercent(totalRemainingPercent)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
