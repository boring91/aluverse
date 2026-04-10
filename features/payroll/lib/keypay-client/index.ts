import {
  KeypayCreateEmployeeInput,
  KeypayCreatePayRunInput,
  KeypayEmployee,
  KeypayEmployeeWriteResult,
  KeypayFinalizePayRunOptions,
  KeypayFinalizePayRunResult,
  KeypayOnboardingUrl,
  KeypayPayRun,
  KeypayPaySchedule,
  KeypayStpStatus,
  KeypaySuperContribution,
  KeypayYtdReportEntry,
  RawKeypayEmployee,
  RawKeypaySuperContribution,
  RawKeypayYtdReportEntry,
} from "./types";
import { request } from "./request";

function toCents(value: number | null | undefined) {
  return value == null ? null : Math.round(value * 100);
}

function mapEmployee(employee: RawKeypayEmployee): KeypayEmployee {
  const { rate, ...rest } = employee;

  return {
    ...rest,
    rateInCents: toCents(rate),
  };
}

function mapYtdReportEntry(
  entry: RawKeypayYtdReportEntry
): KeypayYtdReportEntry {
  const {
    amount,
    netEarnings,
    taxableEarnings,
    totalAllowances,
    totalDeductions,
    ...rest
  } = entry;

  return {
    ...rest,
    amountInCents: toCents(amount),
    netEarningsInCents: toCents(netEarnings),
    taxableEarningsInCents: toCents(taxableEarnings),
    totalAllowancesInCents: toCents(totalAllowances),
    totalDeductionsInCents: toCents(totalDeductions),
  };
}

function mapSuperContribution(
  contribution: RawKeypaySuperContribution
): KeypaySuperContribution {
  const { accrualAmount, ...rest } = contribution;

  return {
    ...rest,
    accrualAmountInCents: toCents(accrualAmount),
  };
}

function getCurrentFinancialYearRange(referenceDate = new Date()) {
  const year =
    referenceDate.getMonth() >= 6
      ? referenceDate.getFullYear()
      : referenceDate.getFullYear() - 1;
  const fromDate = new Date(year, 6, 1);

  return {
    fromDate: fromDate.toISOString(),
    toDate: referenceDate.toISOString(),
  };
}

function getCurrentQuarterRange(referenceDate = new Date()) {
  const quarterStartMonth = Math.floor(referenceDate.getMonth() / 3) * 3;
  const fromDate = new Date(referenceDate.getFullYear(), quarterStartMonth, 1);

  return {
    fromDate: fromDate.toISOString(),
    toDate: referenceDate.toISOString(),
  };
}

function getStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : null;
}

export const keypayClient = {
  listEmployees: async () =>
    // TODO: add pagination once the employee list grows enough for this endpoint to page.
    (
      await request<RawKeypayEmployee[]>({
        path: "/employee/unstructured",
      })
    ).map(mapEmployee),

  getEmployee: async (id: number) =>
    mapEmployee(
      await request<RawKeypayEmployee>({
        path: `/employee/unstructured/${id}`,
      })
    ),

  createEmployee: async (data: KeypayCreateEmployeeInput) =>
    request<KeypayEmployeeWriteResult>({
      path: "/employee/unstructured",
      method: "POST",
      body: data,
    }),

  getOnboardingUrl: async (employeeId: number) => {
    const response = await request<{ url?: string } | null>({
      path: "/employeeonboarding/initiateselfservice",
      method: "POST",
      body: {
        id: employeeId,
      },
    });

    return {
      url: response && typeof response.url === "string" ? response.url : null,
    } satisfies KeypayOnboardingUrl;
  },

  listPaySchedules: async () =>
    request<KeypayPaySchedule[]>({
      path: "/payschedule",
    }),

  listPayRuns: async (payScheduleId?: number) =>
    request<KeypayPayRun[]>({
      path: "/payrun",
      searchParams: {
        payScheduleId,
      },
    }),

  createPayRun: async (
    payScheduleId: number,
    periodEndingDate: string,
    options: Omit<
      KeypayCreatePayRunInput,
      "payPeriodEnding" | "payScheduleId"
    > = {}
  ) =>
    request<KeypayPayRun>({
      path: "/payrun",
      method: "POST",
      body: {
        ...options,
        payScheduleId,
        payPeriodEnding: periodEndingDate,
      },
    }),

  getPayRun: async (payRunId: number) =>
    request<KeypayPayRun>({
      path: `/payrun/${payRunId}`,
    }),

  calculatePayRun: async (payRunId: number) =>
    request<null>({
      path: `/payrun/${payRunId}/recalculate`,
      method: "POST",
    }),

  finalizePayRun: async (
    payRunId: number,
    options: Omit<KeypayFinalizePayRunOptions, "payRunId"> = {}
  ) => {
    const result = await request<KeypayFinalizePayRunResult>({
      path: `/payrun/${payRunId}/finalise`, // cspell:words finalise
      method: "POST",
      body: {
        ...options,
        payRunId,
      },
    });

    return {
      ...result,
      superPayments: result.superPayments ?? [],
    } satisfies KeypayFinalizePayRunResult;
  },

  getStpStatus: async (payRunId: number) => {
    const payRunSummary = await request<Record<string, unknown>>({
      path: `/payrun/${payRunId}/summary`,
    });

    return {
      status:
        getStringValue(payRunSummary, "stpStatus") ??
        getStringValue(payRunSummary, "lodgementStatus") ??
        getStringValue(payRunSummary, "status"),
      detail:
        getStringValue(payRunSummary, "stpError") ??
        getStringValue(payRunSummary, "stpMessage") ??
        getStringValue(payRunSummary, "additionalInfo"),
      jobId: getStringValue(payRunSummary, "payRunLodgementJobId"),
    } satisfies KeypayStpStatus;
  },

  getYtdReport: async () => {
    const { fromDate, toDate } = getCurrentFinancialYearRange();

    return (
      await request<RawKeypayYtdReportEntry[]>({
        path: "/report/paymenthistory",
        searchParams: {
          FromDate: fromDate,
          ToDate: toDate,
        },
      })
    ).map(mapYtdReportEntry);
  },

  getSuperContributions: async () => {
    const { fromDate, toDate } = getCurrentQuarterRange();

    return (
      await request<RawKeypaySuperContribution[]>({
        path: "/report/supercontributions/byemployee", // cspell:words byemployee
        searchParams: {
          FromDate: fromDate,
          ToDate: toDate,
        },
      })
    ).map(mapSuperContribution);
  },
};

export * from "./types";
