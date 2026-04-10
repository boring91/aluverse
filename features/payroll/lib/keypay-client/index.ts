import {
  KeypayCreateEmployeeInput,
  KeypayCreatePayRunInput,
  KeypayEmployee,
  KeypayEmployeeWriteResult,
  KeypayFinalizePayRunOptions,
  KeypayFinalizePayRunResult,
  KeypayPayRun,
  KeypayPaySchedule,
  KeypayPayScheduleWriteInput,
  KeypaySendOnboardingEmailInput,
  KeypaySendOnboardingEmailResult,
  KeypayStpStatus,
  KeypaySuperContribution,
  KeypayYtdReportEntry,
  RawKeypayEmployee,
  RawKeypaySuperContribution,
  RawKeypayYtdReportEntry,
} from "./types";
import { request } from "./request";

type KeypayLocation = {
  id: number;
  name?: string | null;
};

type KeypayPayCategory = {
  id: number;
  name?: string | null;
  rateUnit?: string | null;
};

// ATO placeholder TFN for new hires who are within the 28-day grace period
// while applying for their real TFN. Employment Hero replaces it during self-service.
const TFN_PLACEHOLDER = "111111111";

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

function getPrimaryLocationName(locations: KeypayLocation[]) {
  if (locations.length > 1) {
    throw new Error(
      "Employment Hero has multiple locations configured. Explicit location selection isn't supported yet — remove extra locations or contact support."
    );
  }

  const primaryLocation = locations[0]?.name;

  if (!primaryLocation) {
    throw new Error(
      "Employment Hero has no locations configured. Please create one before adding employees."
    );
  }

  return primaryLocation;
}

function getPrimaryPayCategoryName(
  payCategories: KeypayPayCategory[],
  employmentType: KeypayCreateEmployeeInput["employmentType"]
) {
  const isCasual = employmentType === "Casual";
  const requiredRateUnit = isCasual ? "Hourly" : "Annually";
  const payCategory = payCategories.find(
    (item) => item.rateUnit === requiredRateUnit && item.name
  );

  if (!payCategory?.name) {
    throw new Error(
      isCasual
        ? "No hourly pay category found in Employment Hero. Please create one before adding casual employees."
        : "No annual pay category found in Employment Hero. Please create one before adding salaried employees."
    );
  }

  return payCategory.name;
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

  deleteEmployee: async (id: number) =>
    request<null>({
      path: `/employee/${id}`,
      method: "DELETE",
    }),

  createEmployee: async (data: KeypayCreateEmployeeInput) => {
    const [locations, payCategories] = await Promise.all([
      request<KeypayLocation[]>({
        path: "/location",
      }),
      request<KeypayPayCategory[]>({
        path: "/paycategory",
      }),
    ]);

    const primaryLocation = getPrimaryLocationName(locations);
    const primaryPayCategory = getPrimaryPayCategoryName(
      payCategories,
      data.employmentType
    );

    return await request<KeypayEmployeeWriteResult>({
      path: "/employee/unstructured",
      method: "POST",
      body: {
        ...data,
        taxFileNumber: TFN_PLACEHOLDER,
        primaryLocation,
        primaryPayCategory,
      },
    });
  },

  sendOnboardingEmail: async (data: KeypaySendOnboardingEmailInput) => {
    // TODO: Re-test the `{ id }` variant on future tenants.
    // This tenant returns 500 for `{ id }`, but succeeds with name/email/mobile.
    await request<null>({
      path: "/employeeonboarding/initiateselfservice",
      method: "POST",
      body: {
        firstName: data.firstName,
        surname: data.surname,
        email: data.email,
        mobile: data.mobile,
      },
    });

    return {
      email: data.email,
    } satisfies KeypaySendOnboardingEmailResult;
  },

  listPaySchedules: async () =>
    request<KeypayPaySchedule[]>({
      path: "/payschedule",
    }),

  getPaySchedule: async (id: number) =>
    request<KeypayPaySchedule>({
      path: `/payschedule/${id}`,
    }),

  createPaySchedule: async (data: KeypayPayScheduleWriteInput) =>
    request<KeypayPaySchedule>({
      path: "/payschedule",
      method: "POST",
      body: {
        ...data,
        locations: [],
      },
    }),

  updatePaySchedule: async (id: number, data: KeypayPayScheduleWriteInput) =>
    request<KeypayPaySchedule>({
      path: `/payschedule/${id}`,
      method: "PUT",
      body: {
        id,
        ...data,
        locations: [],
      },
    }),

  deletePaySchedule: async (id: number) =>
    request<null>({
      path: `/payschedule/${id}`,
      method: "DELETE",
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
