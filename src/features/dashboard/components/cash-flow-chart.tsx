"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { DashboardSection } from "./dashboard-section";
import { formatCurrency, stringsToNeutralColors } from "@/lib/utils";

const fills = stringsToNeutralColors(["income", "expense"]);

export const CashFlowChart = () => {
  const trpc = useTRPC();

  const { data, isLoading } = useQuery(trpc.dashboard.cashFlow.queryOptions());

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
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Cash flow timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                income: {
                  color: fills[0],
                },
                expense: {
                  color: fills[1],
                },
              }}
              className="aspect-auto! h-[280px] w-full"
            >
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => formatCurrency(value)}
                  width={90}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(_, __, payload) => {
                        return (
                          <div className="flex items-center gap-2">
                            <div
                              className="w-0 border-[1.5px] border-dashed bg-transparent my-0.5"
                              style={{
                                borderColor: payload.color,
                              }}
                            />
                            <span className="text-muted-foreground">
                              {payload.name === "income" ? "Income" : "Expense"}
                              :
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {`${formatCurrency(payload.value as number)}`}
                            </span>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--color-expense)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </DashboardSection>
  );
};
