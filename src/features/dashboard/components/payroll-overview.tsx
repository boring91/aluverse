"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BanknoteIcon,
  CalendarClockIcon,
  CoinsIcon,
  PiggyBankIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { formatDateString } from "@/lib/shared-utils";
import { formatCurrency } from "@/lib/utils";
import { useTRPC } from "@/trpc";
import { DashboardSection } from "./dashboard-section";

export const PayrollOverview = () => {
  const trpc = useTRPC();
  const { hasPermission } = useRbacAccess();
  const canRead = hasPermission("payroll.read");

  const { data, isLoading } = useQuery(
    trpc.payroll.getDashboardStats.queryOptions(undefined, {
      enabled: canRead,
    }),
  );

  const skeleton = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-8 w-28" />
        </Card>
      ))}
    </div>
  );

  if (!canRead) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Payroll</h2>
      <DashboardSection isLoading={isLoading} skeleton={skeleton}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BanknoteIcon size={16} />
                Gross payroll (FYTD)
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-2xl font-bold font-mono">
                {formatCurrency(data?.ytdGrossInCents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Net paid: {formatCurrency(data?.ytdNetInCents ?? 0)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CoinsIcon size={16} />
                PAYG this quarter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-2xl font-bold font-mono text-rose-500">
                {formatCurrency(data?.quarterPaygInCents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">Owed to the ATO</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <PiggyBankIcon size={16} />
                Super this quarter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-2xl font-bold font-mono text-amber-500">
                {formatCurrency(data?.quarterSuperInCents ?? 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Via clearing house
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CalendarClockIcon size={16} />
                Last pay run
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <div className="text-2xl font-bold font-mono">
                {data?.lastFinalizedPayRun
                  ? formatDateString(data.lastFinalizedPayRun.datePaid)
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {data?.lastFinalizedPayRun
                  ? "Finalized"
                  : "No finalized pay runs yet"}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardSection>
    </div>
  );
};
