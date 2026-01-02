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
import { formatCurrency, formatPercent } from "../lib/dummy-data";
import { cn } from "@/lib/client-utils";
import { useTranslations } from "next-intl";

type BudgetSpending = {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  remainingPercent: number;
};

type BudgetTableProps = {
  data: BudgetSpending[];
};

export const BudgetTable = ({ data }: BudgetTableProps) => {
  const t = useTranslations("FinancialAccounts");

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      allocated: acc.allocated + item.allocated,
      spent: acc.spent + Math.abs(item.spent),
      remaining: acc.remaining + item.remaining,
    }),
    { allocated: 0, spent: 0, remaining: 0 }
  );

  const totalRemainingPercent =
    totals.allocated > 0
      ? ((totals.remaining / totals.allocated) * 100).toFixed(2)
      : "0.00";

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      subscription: t("subscription"),
      consumable: t("consumable"),
      toll: t("toll"),
      tool: t("tool"),
      food: t("food"),
      salary: t("salary"),
      fuel: t("fuel"),
    };
    return categoryMap[category] || category;
  };

  return (
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
            {data.map((item) => {
              const isNegative = item.remaining < 0;
              const progressValue =
                item.allocated > 0
                  ? Math.max(
                      0,
                      Math.min(
                        100,
                        ((item.allocated - Math.abs(item.spent)) /
                          item.allocated) *
                          100
                      )
                    )
                  : 0;

              return (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">
                    {getCategoryLabel(item.category)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.allocated)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.spent)}
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
                  parseFloat(totalRemainingPercent) < 0 && "text-destructive",
                  parseFloat(totalRemainingPercent) >= 0 && "text-primary"
                )}
              >
                {formatPercent(parseFloat(totalRemainingPercent))}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
