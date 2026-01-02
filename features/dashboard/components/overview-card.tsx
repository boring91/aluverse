"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/client-utils";
import { formatCurrency } from "@/lib/utils";

type OverviewCardProps = {
  title: string;
  value: number;
  className?: string;
};

export const OverviewCard = ({
  title,
  value,
  className,
}: OverviewCardProps) => {
  const isNegative = value < 0;
  const isPositive = value > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "text-2xl font-bold font-mono",
            isNegative && "text-destructive",
            isPositive && "text-primary"
          )}
        >
          {formatCurrency(value)}
        </div>
      </CardContent>
    </Card>
  );
};
