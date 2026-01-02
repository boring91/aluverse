"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "../lib/dummy-data";
import { CalendarIcon } from "lucide-react";

type ProjectPipelineProps = {
  data: {
    planning: number;
    inProgress: number;
    totalValue: number;
    upcomingProjects: {
      project: string;
      client: string;
      value: number;
      startDate: string;
    }[];
  };
};

export const ProjectPipeline = ({ data }: ProjectPipelineProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Planning</div>
            <div className="text-2xl font-semibold">{data.planning}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              In Progress
            </div>
            <div className="text-2xl font-semibold">{data.inProgress}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Total Value
            </div>
            <div className="text-2xl font-semibold">
              {formatCurrency(data.totalValue)}
            </div>
          </div>
        </div>

        {data.upcomingProjects.length > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="text-sm font-medium">Upcoming Projects</div>
            {data.upcomingProjects.map((project) => (
              <div
                key={project.project}
                className="flex items-start justify-between p-3 rounded-lg border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {project.project}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(project.value)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {project.client}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarIcon className="h-3 w-3" />
                    Starts: {new Date(project.startDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
