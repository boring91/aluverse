import {
  KeypayCalculatePayRunEmployeeHoursInput,
  KeypayCreateEmployeeInput,
  KeypayCreatePayRunInput,
  KeypayEmployee,
  KeypayEmployeePayRate,
  KeypayEmployeeWriteResult,
  KeypayFinalizePayRunOptions,
  KeypayFinalizePayRunResult,
  KeypayPayRun,
  KeypayPayRunListItem,
  KeypayPaySchedule,
  KeypayPayScheduleWriteInput,
  KeypaySendOnboardingEmailInput,
  KeypaySendOnboardingEmailResult,
  KeypayStpStatus,
  KeypaySuperContribution,
  KeypayYtdReportEntry,
  RawKeypayEmployee,
  RawKeypayPayRun,
  RawKeypayPayRunEarningsLinesResponse,
  RawKeypayPayRunSummary,
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

type KeypayPayRunStatus = KeypayPayRunListItem["status"];

// ATO placeholder TFN for new hires who are within the 28-day grace period
// while applying for their real TFN. Employment Hero replaces it during self-service.
const TFN_PLACEHOLDER = "111111111";

function checkOnboardingComplete(employee: RawKeypayEmployee) {
  const hasTfn =
    !!employee.taxFileNumber && employee.taxFileNumber !== TFN_PLACEHOLDER;
  const hasBankAccount =
    !!employee.bankAccount1_BSB && !!employee.bankAccount1_AccountNumber;
  const hasSuperFund = !!employee.superFund1_FundName;

  return hasTfn && hasBankAccount && hasSuperFund;
}

function toCents(value: number | null | undefined) {
  return value == null ? null : Math.round(value * 100);
}

function mapEmployee(employee: RawKeypayEmployee): KeypayEmployee {
  // Strip sensitive fields (TFN, bank, super) from the client response
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    rate,
    taxFileNumber,
    bankAccount1_BSB,
    bankAccount1_AccountNumber,
    superFund1_FundName,
    ...rest
  } = employee;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return {
    ...rest,
    rateInCents: toCents(rate),
    hasCompletedOnboarding: checkOnboardingComplete(employee),
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

function mapPayRun(payRun: RawKeypayPayRun): KeypayPayRun {
  const { dateFinalised, isFinalised, ...rest } = payRun; // cspell:ignore Finalised

  return {
    ...rest,
    dateFinalized: dateFinalised ?? null,
    isFinalized: isFinalised,
  };
}

function mapPayRunSummary(summary: RawKeypayPayRunSummary) {
  const { totalGrossWages, totalNetWages, totalHours, ...rest } = summary;

  return {
    ...rest,
    totalHours: totalHours ?? null,
    totalGrossWagesInCents: toCents(totalGrossWages),
    totalNetWagesInCents: toCents(totalNetWages),
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

function getSingleLocationId(locations: KeypayLocation[]) {
  if (locations.length > 1) {
    throw new Error(
      "Employment Hero has multiple locations configured. Explicit location selection isn't supported yet — remove extra locations or contact support."
    );
  }

  const primaryLocationId = locations[0]?.id;

  if (!primaryLocationId) {
    throw new Error(
      "Employment Hero has no locations configured. Please create one before adding employees."
    );
  }

  return primaryLocationId;
}

function getEmployeeHoursDefaults(
  employmentType: KeypayCreateEmployeeInput["employmentType"]
) {
  if (employmentType === "Casual") {
    return { hoursPerWeek: 0, automaticallyPayEmployee: false };
  }

  if (employmentType === "PartTime") {
    return { hoursPerWeek: 19, automaticallyPayEmployee: true };
  }

  // FullTime and anything else
  return { hoursPerWeek: 38, automaticallyPayEmployee: true };
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

function flattenPayRunEarningsLines(
  response: RawKeypayPayRunEarningsLinesResponse
) {
  return Object.values(response.earningsLines ?? {}).flatMap(
    (lines) => lines ?? []
  );
}

function getPayRunStatus(
  payRun: KeypayPayRun,
  summary: RawKeypayPayRunSummary,
  earningsLines: RawKeypayPayRunEarningsLinesResponse
) {
  if (payRun.isFinalized) {
    return "Finalized" satisfies KeypayPayRunStatus;
  }

  // Employment Hero does not expose a dedicated persisted "calculated" flag,
  // so we infer it from generated totals or earnings lines being present.
  const hasCalculatedValues =
    (summary.totalHours ?? 0) > 0 ||
    (summary.totalGrossWages ?? 0) > 0 ||
    (summary.totalNetWages ?? 0) > 0 ||
    flattenPayRunEarningsLines(earningsLines).length > 0;

  return hasCalculatedValues
    ? ("Calculated" satisfies KeypayPayRunStatus)
    : ("Draft" satisfies KeypayPayRunStatus);
}

function getPrimaryEmployeePayRate(payRates: KeypayEmployeePayRate[]) {
  const primaryPayRate = payRates.find(
    (payRate) => payRate.isPrimaryPayCategory
  );

  if (!primaryPayRate) {
    throw new Error(
      "Employment Hero has no primary pay rate configured for this employee."
    );
  }

  return primaryPayRate;
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

  activateEmployee: async (id: number) =>
    request<KeypayEmployeeWriteResult>({
      path: `/employee/unstructured/${id}`,
      method: "PUT",
      body: { status: "Active" },
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
    // Employment Hero leaves new employees with hoursPerWeek: 0 and automaticallyPayEmployee: false
    // unless we set them explicitly. Without these, salaried employees will never appear in a
    // calculated pay run. Casuals keep the defaults because their hours are entered per pay run.
    const { hoursPerWeek, automaticallyPayEmployee } = getEmployeeHoursDefaults(
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
        hoursPerWeek: data.hoursPerWeek ?? hoursPerWeek,
        automaticallyPayEmployee,
      },
    });
  },

  sendOnboardingEmail: async (data: KeypaySendOnboardingEmailInput) => {
    // The self-service endpoint creates a new employee if `id` is omitted.
    // Always send the existing employee ID when inviting from Aluverse.
    await request<null>({
      path: "/employeeonboarding/initiateselfservice",
      method: "POST",
      body: {
        id: data.employeeId,
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

  // TODO: Each pay run requires 2 extra API calls (summary + earnings lines) to infer status.
  // This will hit rate limits as pay run count grows. Consider paginating, caching status,
  // or limiting enrichment to the most recent N pay runs.
  listPayRuns: async (payScheduleId?: number) => {
    const [allPayRuns, paySchedules] = await Promise.all([
      // The KeyPay AU /payrun endpoint ignores server-side query filters (both `payScheduleId`
      // and OData `$filter=payScheduleId eq X` return unfiltered results or 500).
      // Fetch everything and filter here before enriching.
      request<RawKeypayPayRun[]>({
        path: "/payrun",
      }),
      request<KeypayPaySchedule[]>({
        path: "/payschedule",
      }),
    ]);
    const payRuns =
      payScheduleId == null
        ? allPayRuns
        : allPayRuns.filter(
            (rawPayRun) => rawPayRun.payScheduleId === payScheduleId
          );
    const payScheduleNamesById = new Map(
      paySchedules.map((paySchedule) => [
        paySchedule.id,
        paySchedule.name ?? null,
      ])
    );

    return await Promise.all(
      payRuns.map(async (rawPayRun) => {
        const [summary, earningsLines] = await Promise.all([
          request<RawKeypayPayRunSummary>({
            path: `/payrun/${rawPayRun.id}/summary`,
          }),
          request<RawKeypayPayRunEarningsLinesResponse>({
            path: `/payrun/${rawPayRun.id}/earningslines`,
          }),
        ]);
        const payRun = mapPayRun(rawPayRun);
        const mappedSummary = mapPayRunSummary(summary);

        return {
          ...payRun,
          payScheduleName:
            payScheduleNamesById.get(payRun.payScheduleId) ?? null,
          totalHours: mappedSummary.totalHours,
          totalGrossWagesInCents: mappedSummary.totalGrossWagesInCents,
          totalNetWagesInCents: mappedSummary.totalNetWagesInCents,
          status: getPayRunStatus(payRun, summary, earningsLines),
        } satisfies KeypayPayRunListItem;
      })
    );
  },

  createPayRun: async (
    payScheduleId: number,
    periodEndingDate: string,
    options: Omit<
      KeypayCreatePayRunInput,
      "payPeriodEnding" | "payScheduleId"
    > = {}
  ) =>
    mapPayRun(
      await request<RawKeypayPayRun>({
        path: "/payrun",
        method: "POST",
        body: {
          ...options,
          payScheduleId,
          payPeriodEnding: periodEndingDate,
          datePaid: options.datePaid ?? periodEndingDate,
        },
      })
    ),

  getPayRun: async (payRunId: number) =>
    mapPayRun(
      await request<RawKeypayPayRun>({
        path: `/payrun/${payRunId}`,
      })
    ),

  deletePayRun: async (payRunId: number) =>
    request<null>({
      path: `/payrun/${payRunId}`,
      method: "DELETE",
    }),

  getPayRunEmployeeHours: async (payRunId: number) => {
    const earningsLines = await request<RawKeypayPayRunEarningsLinesResponse>({
      path: `/payrun/${payRunId}/earningslines`,
    });
    const flattenedEarningsLines = flattenPayRunEarningsLines(earningsLines);
    const employeeIds = Array.from(
      new Set(
        flattenedEarningsLines
          .map((earningsLine) => Number(earningsLine.employeeId))
          .filter((employeeId) => Number.isFinite(employeeId))
      )
    );

    if (employeeIds.length === 0) {
      return [];
    }

    const primaryPayRateByEmployeeId = new Map(
      await Promise.all(
        employeeIds.map(async (employeeId) => {
          const payRates = await request<KeypayEmployeePayRate[]>({
            path: `/employee/${employeeId}/payrate`,
          });

          return [employeeId, getPrimaryEmployeePayRate(payRates)] as const;
        })
      )
    );

    return employeeIds.flatMap((employeeId) => {
      const primaryPayRate = primaryPayRateByEmployeeId.get(employeeId);

      if (!primaryPayRate) {
        return [];
      }

      const units = flattenedEarningsLines
        .filter((earningsLine) => {
          return (
            Number(earningsLine.employeeId) === employeeId &&
            Number(earningsLine.payCategoryId) === primaryPayRate.payCategoryId
          );
        })
        .reduce((total, earningsLine) => total + (earningsLine.units ?? 0), 0);

      if (units <= 0) {
        return [];
      }

      return [
        {
          employeeId,
          units,
        },
      ];
    });
  },

  calculatePayRun: async (
    payRunId: number,
    employeeHours: KeypayCalculatePayRunEmployeeHoursInput[] = []
  ) => {
    if (employeeHours.length > 0) {
      const locations = await request<KeypayLocation[]>({
        path: "/location",
      });
      const locationId = getSingleLocationId(locations);

      await Promise.all(
        employeeHours.map(async ({ employeeId, units }) => {
          const [earningsLines, payRates] = await Promise.all([
            request<RawKeypayPayRunEarningsLinesResponse>({
              path: `/payrun/${payRunId}/earningslines/${employeeId}`,
            }),
            request<KeypayEmployeePayRate[]>({
              path: `/employee/${employeeId}/payrate`,
            }),
          ]);
          const primaryPayRate = getPrimaryEmployeePayRate(payRates);

          if (primaryPayRate.rateUnit !== "Hourly") {
            throw new Error(
              "Only hourly employees can have manual hours entered before calculating a pay run."
            );
          }

          const existingPrimaryEarningsLines = flattenPayRunEarningsLines(
            earningsLines
          ).filter((earningsLine) => {
            return (
              Number(earningsLine.payCategoryId) ===
              primaryPayRate.payCategoryId
            );
          });

          await Promise.all(
            existingPrimaryEarningsLines.map((earningsLine) =>
              request<null>({
                path: `/payrun/${payRunId}/earningslines`,
                method: "DELETE",
                searchParams: {
                  id: earningsLine.id,
                },
              })
            )
          );

          if (units <= 0) {
            return;
          }

          await request<null>({
            path: `/payrun/${payRunId}/earningslines`,
            method: "POST",
            body: {
              payRunId,
              replaceExisting: false,
              suppressCalculations: true,
              employeeIdType: "Standard",
              locationIdType: "Standard",
              payCategoryIdType: "Standard",
              earningsLines: {
                [String(employeeId)]: [
                  {
                    employeeId: String(employeeId),
                    locationId: String(locationId),
                    payCategoryId: String(primaryPayRate.payCategoryId),
                    units,
                    rate: primaryPayRate.rate,
                  },
                ],
              },
            },
          });
        })
      );
    }

    return await request<null>({
      path: `/payrun/${payRunId}/recalculate`,
      method: "POST",
    });
  },

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
        // Do not rely on tenant-level manual defaults here; finalizing from Aluverse
        // should also trigger the STP lodgement path unless explicitly overridden.
        lodgePayRun: options.lodgePayRun ?? true,
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
