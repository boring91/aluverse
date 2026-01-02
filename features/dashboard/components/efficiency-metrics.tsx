"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatPercent } from "../lib/dummy-data";

type EfficiencyMetricsProps = {
  data: {
    revenuePerProject: number;
    costPerProject: number;
    averageProjectValue: number;
    projectsCompleted: number;
    totalProjects: number;
    completionRate: number;
  };
};

export const EfficiencyMetrics = ({ data }: EfficiencyMetricsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Revenue per Project
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.revenuePerProject)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Cost per Project
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.costPerProject)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Avg. Project Value
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(data.averageProjectValue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Completion Rate
            </div>
            <div className="text-lg font-semibold">
              {formatPercent(data.completionRate)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Projects Completed</span>
            <span className="font-medium">
              {data.projectsCompleted} / {data.totalProjects}
            </span>
          </div>
          <Progress value={data.completionRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
