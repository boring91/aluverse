import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency } from "@/lib/utils";

export const ProjectPipeline = () => {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.dashboard.projectPipeline.queryOptions(),
  );

  const skeleton = (
    <Card>
      <div className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>
  );

  return (
    <DashboardSection isLoading={isLoading} skeleton={skeleton}>
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Project pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Planning
                </div>
                <div className="text-2xl font-semibold">
                  {data.stats.planningCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  In progress
                </div>
                <div className="text-2xl font-semibold">
                  {data.stats.inProgressCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Total value
                </div>
                <div className="text-2xl font-semibold">
                  {formatCurrency(data.stats.totalValue)}
                </div>
              </div>
            </div>

            {data.pipeline.length > 0 && (
              <div className="pt-4 border-t space-y-3">
                <div className="text-sm font-medium">Upcoming projects</div>
                <div className="grid lg:grid-cols-3 gap-4">
                  {data.pipeline.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-start justify-between p-3 border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {project.humanId}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatCurrency(project.price)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {project.client}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarIcon className="h-3 w-3" />
                          {project.startDate
                            ? `Started: ${project.startDate.toLocaleDateString()}`
                            : project.visitDate
                              ? `Starts: ${project.visitDate.toLocaleDateString()}`
                              : "Not visited yet"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
