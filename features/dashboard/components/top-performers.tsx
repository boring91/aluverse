"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "../lib/dummy-data";
import { cn } from "@/lib/client-utils";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";

type Performer = {
  project: string;
  client: string;
  profitMargin: number;
  revenue: number;
};

type TopPerformersProps = {
  top: Performer[];
  bottom: Performer[];
};

export const TopPerformers = ({ top, bottom }: TopPerformersProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {top.map((item, index) => (
            <div
              key={item.project}
              className="flex items-start justify-between p-3 rounded-lg border border-primary/20 bg-primary/5"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.project}</span>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {item.client}
                </div>
                <div className="text-xs text-muted-foreground">
                  Revenue: {formatCurrency(item.revenue)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-primary">
                  {formatPercent(item.profitMargin)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Profit Margin
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDownIcon className="h-5 w-5 text-destructive" />
            Bottom Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bottom.map((item, index) => (
            <div
              key={item.project}
              className="flex items-start justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{item.project}</span>
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {item.client}
                </div>
                <div className="text-xs text-muted-foreground">
                  Revenue: {formatCurrency(item.revenue)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-destructive">
                  {formatPercent(item.profitMargin)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Profit Margin
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
