"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/page-container";
import { PageLoader } from "@/components/page-loader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { useConfirm } from "@/lib/confirm-context";
import { useTitle } from "@/hooks/use-title";
import { useTRPC } from "@/trpc/client";

function getEofyYearOptions() {
  // Australian financial years end on 30 June. The ending year is the calendar
  // year containing the June. Offer the last three finished or current FYs so
  // the user can pick whichever they want to finalize.
  const now = new Date();
  const thisYearEnding =
    now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return [thisYearEnding, thisYearEnding - 1, thisYearEnding - 2];
}

function formatFinancialYear(yearEnding: number) {
  return `FY${yearEnding} (1 July ${yearEnding - 1} - 30 June ${yearEnding})`;
}

export const PayrollSettingsView = () => {
  useTitle("Payroll Settings");
  const trpc = useTRPC();
  const { confirm } = useConfirm();
  const { hasPermission, isPending: isAccessPending } = useRbacAccess();

  const canRead = hasPermission("payroll.read");
  const canWrite = hasPermission("payroll.write");

  const yearOptions = getEofyYearOptions();
  const [selectedYear, setSelectedYear] = useState<number>(yearOptions[0]);

  const finalizeEofyMutation = useMutation(
    trpc.payroll.finalizeEofy.mutationOptions({
      onSuccess: (result) => {
        toast.success(
          `EOFY ${result.financialYearEnding} finalized — ${result.generatedCount} payment summaries published.`
        );
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const handleFinalizeEofy = () => {
    if (!canWrite) {
      return;
    }

    confirm({
      title: `Finalize ${formatFinancialYear(selectedYear)}?`,
      description:
        "This generates and publishes payment summaries for every employee for the selected financial year, and reports the finalization to the ATO via STP. It should only be done once per financial year after the last pay run is finalized. Are you sure you want to continue?",
      onConfirm: () => {
        finalizeEofyMutation.mutate({ financialYearEnding: selectedYear });
      },
    });
  };

  if (isAccessPending) {
    return (
      <PageContainer>
        <PageLoader />
      </PageContainer>
    );
  }

  if (!canRead) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">
          You do not have access to payroll settings.
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <h1 className="font-bold text-2xl">Settings</h1>

        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              End of financial year
            </h2>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangleIcon size={16} className="text-amber-500" />
                  Finalize EOFY
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Once all pay runs for the financial year are finalized, lodge
                  the EOFY finalization with the ATO. This publishes payment
                  summaries for every employee and tells the ATO that you have
                  completed reporting for the financial year.
                </p>

                <Alert>
                  <AlertTriangleIcon />
                  <AlertTitle>This should only be done once a year</AlertTitle>
                  <AlertDescription>
                    Run this only after the last pay run of the financial year
                    has been finalized. If you finalize too early, you will need
                    to amend and re-finalize it again.
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="flex flex-col gap-2 md:flex-1">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Financial year
                    </label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {formatFinancialYear(selectedYear)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {formatFinancialYear(year)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    disabled={!canWrite || finalizeEofyMutation.isPending}
                    onClick={handleFinalizeEofy}
                  >
                    Finalize EOFY {selectedYear}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </PageContainer>
  );
};
