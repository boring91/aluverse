"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "../lib/dummy-data";
import { cn } from "@/lib/client-utils";
import { AlertTriangleIcon, CheckCircleIcon } from "lucide-react";

type BudgetBurnRateProps = {
  data: {
    monthlySpend: number;
    allocated: number;
    daysRemaining: number;
    projectedOverspend: boolean;
    burnRate: number;
  };
};

export const BudgetBurnRate = ({ data }: BudgetBurnRateProps) => {
  const spentPercent = (Math.abs(data.monthlySpend) / data.allocated) * 100;
  const remaining = data.allocated - Math.abs(data.monthlySpend);
  const projectedSpend = data.burnRate * data.daysRemaining;
  const projectedTotal = Math.abs(data.monthlySpend) + projectedSpend;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Budget Burn Rate
          {data.projectedOverspend ? (
            <AlertTriangleIcon className="h-5 w-5 text-destructive" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 text-primary" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">
              {formatCurrency(data.monthlySpend)} /{" "}
              {formatCurrency(data.allocated)}
            </span>
          </div>
          <Progress value={spentPercent} className="h-2" />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{spentPercent.toFixed(1)}% used</span>
            <span>{formatCurrency(remaining)} remaining</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Daily Burn Rate
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.burnRate)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Days Remaining
            </div>
            <div className="text-lg font-semibold">{data.daysRemaining}</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground mb-1">
            Projected Total Spend
          </div>
          <div
            className={cn(
              "text-lg font-semibold",
              data.projectedOverspend && "text-destructive"
            )}
          >
            {formatCurrency(projectedTotal)}
          </div>
          {data.projectedOverspend && (
            <div className="text-xs text-destructive mt-1">
              Projected to exceed budget by{" "}
              {formatCurrency(projectedTotal - data.allocated)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
