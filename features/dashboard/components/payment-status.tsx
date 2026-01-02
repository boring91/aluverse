"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatPercent } from "../lib/dummy-data";
import { cn } from "@/lib/client-utils";

type PaymentStatusProps = {
  data: {
    averagePaymentDays: number;
    onTimePayments: number;
    latePayments: number;
    overduePayments: number;
    paymentVelocity: number;
  };
};

export const PaymentStatus = ({ data }: PaymentStatusProps) => {
  const totalPayments =
    data.onTimePayments + data.latePayments + data.overduePayments;
  const onTimePercent =
    totalPayments > 0 ? (data.onTimePayments / totalPayments) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Payment Velocity</span>
            <span className="font-medium">
              {formatPercent(data.paymentVelocity)}
            </span>
          </div>
          <Progress value={data.paymentVelocity} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Avg. Payment Days
            </div>
            <div className="text-lg font-semibold">
              {data.averagePaymentDays} days
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              On-Time Rate
            </div>
            <div className="text-lg font-semibold">
              {formatPercent(onTimePercent)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">On-Time Payments</span>
            <span className="font-medium text-primary">
              {data.onTimePayments}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Late Payments</span>
            <span className="font-medium text-yellow-600">
              {data.latePayments}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Overdue Payments</span>
            <span
              className={cn(
                "font-medium",
                data.overduePayments > 0 && "text-destructive"
              )}
            >
              {data.overduePayments}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
