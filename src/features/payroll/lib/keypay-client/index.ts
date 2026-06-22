import type {
  KeypayCalculatePayRunEmployeeHoursInput,
  KeypayCreateEmployeeInput,
  KeypayCreatePayRunInput,
  KeypayEmployee,
  KeypayEmployeePayRate,
  KeypayEmployeeWriteResult,
  KeypayFinalizePayRunOptions,
  KeypayFinalizePayRunResult,
  KeypayPayRun,
  KeypayPayRunBankPayment,
  KeypayPayRunDetails,
  KeypayPayRunEmployeeTotal,
  KeypayPayRunGrandTotal,
  KeypayPayRunListItem,
  KeypayPayrollDashboardStats,
  KeypayPaySchedule,
  KeypayPayScheduleWriteInput,
  KeypaySendOnboardingEmailInput,
  KeypaySendOnboardingEmailResult,
  KeypayStpStatus,
  KeypaySuperContribution,
  KeypayYtdReportEntry,
  RawKeypayEmployee,
  RawKeypayEmployeeBankAccount,
  RawKeypayPayRun,
  RawKeypayPayRunActivityEntry,
  RawKeypayPayRunBankPayment,
  RawKeypayPayRunDetails,
  RawKeypayPayRunEarningsLinesResponse,
  RawKeypayPayRunEmployeeTotal,
  RawKeypayPayRunGrandTotal,
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

// Keypay's canonical employmentType is the spaced label ("Full Time" / "Part Time" /
// "Casual"). The rest of Aluverse uses the camelCase enum, so this client is the single
// boundary that translates in both directions — no other layer sees the spaced form.
function mapEmployee(employee: RawKeypayEmployee): KeypayEmployee {
  // Strip sensitive fields (TFN, bank, super) from the client response

  const {
    rate,
    employmentType,
    taxFileNumber,
    bankAccount1_BSB,
    bankAccount1_AccountNumber,
    superFund1_FundName,
    ...rest
  } = employee;

  return {
    ...rest,
    employmentType:
      employmentType === "Full Time"
        ? "FullTime"
        : employmentType === "Part Time"
          ? "PartTime"
          : employmentType === "Casual"
            ? "Casual"
            : null,
    rateInCents: toCents(rate),
    hasCompletedOnboarding: checkOnboardingComplete(employee),
  };
}

function mapYtdReportEntry(
  entry: RawKeypayYtdReportEntry,
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
  contribution: RawKeypaySuperContribution,
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

function mapPayRunEmployeeTotal(
  total: RawKeypayPayRunEmployeeTotal,
): KeypayPayRunEmployeeTotal {
  return {
    id: total.id,
    employeeId: total.employeeId,
    employeeName: total.employeeName ?? null,
    totalHours: total.totalHours ?? null,
    grossEarningsInCents: toCents(total.grossEarnings),
    netEarningsInCents: toCents(total.netEarnings),
    taxableEarningsInCents: toCents(total.taxableEarnings),
    paygWithholdingInCents: toCents(total.paygWithholdingAmount),
    superContributionInCents: toCents(total.superContribution),
    isExcluded: total.isExcluded ?? false,
    isComplete: total.isComplete ?? false,
    isTermination: total.isTermination ?? false,
  };
}

function mapPayRunGrandTotal(
  grandTotal: RawKeypayPayRunGrandTotal,
): KeypayPayRunGrandTotal {
  return {
    numberOfEmployees: grandTotal.numberOfEmployees ?? 0,
    totalHours: grandTotal.totalHours ?? null,
    grossEarningsInCents: toCents(grandTotal.grossEarnings),
    netEarningsInCents: toCents(grandTotal.netEarnings),
    taxableEarningsInCents: toCents(grandTotal.taxableEarnings),
    paygWithholdingInCents: toCents(grandTotal.paygWithholdingAmount),
    superContributionInCents: toCents(grandTotal.superContribution),
  };
}

// Employment Hero allocates net pay across an employee's bank accounts in this order:
// fixed amounts first, then percentage allocations of the original net, then the
// `allocateBalance` account receives whatever is left.
function allocateNetPay(
  netPayInCents: number,
  accounts: RawKeypayEmployeeBankAccount[],
) {
  const amountsById = new Map<number, number>();
  let remaining = netPayInCents;

  for (const account of accounts) {
    if (account.fixedAmount != null && !account.allocateBalance) {
      const amountInCents = Math.min(
        toCents(account.fixedAmount) ?? 0,
        remaining,
      );
      amountsById.set(account.id, amountInCents);
      remaining -= amountInCents;
    }
  }

  for (const account of accounts) {
    if (
      account.fixedAmount == null &&
      account.allocatedPercentage != null &&
      !account.allocateBalance
    ) {
      const amountInCents = Math.round(
        (netPayInCents * account.allocatedPercentage) / 100,
      );
      const allocated = Math.min(amountInCents, Math.max(0, remaining));
      amountsById.set(account.id, allocated);
      remaining -= allocated;
    }
  }

  const balanceAccount = accounts.find((account) => account.allocateBalance);
  if (balanceAccount) {
    amountsById.set(balanceAccount.id, Math.max(0, remaining));
  }

  return amountsById;
}

function buildPayRunBankPayments(
  employees: KeypayPayRunEmployeeTotal[],
  bankAccountsByEmployeeId: Map<number, RawKeypayEmployeeBankAccount[]>,
): KeypayPayRunBankPayment[] {
  return employees.flatMap((employee) => {
    if (employee.isExcluded || employee.netEarningsInCents == null) {
      return [];
    }

    const accounts = bankAccountsByEmployeeId.get(employee.employeeId) ?? [];
    if (accounts.length === 0) {
      return [];
    }

    const amountsById = allocateNetPay(employee.netEarningsInCents, accounts);

    return accounts
      .map((account) => ({
        employeeId: employee.employeeId,
        employeeName: employee.employeeName,
        bankAccountId: account.id,
        accountType: account.accountType ?? null,
        bsb: account.bsb ?? null,
        accountName: account.accountName ?? null,
        accountNumber: account.accountNumber ?? null,
        amountInCents: amountsById.get(account.id) ?? 0,
      }))
      .filter((payment) => payment.amountInCents > 0);
  });
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
      "Employment Hero has multiple locations configured. Explicit location selection isn't supported yet — remove extra locations or contact support.",
    );
  }

  const primaryLocation = locations[0]?.name;

  if (!primaryLocation) {
    throw new Error(
      "Employment Hero has no locations configured. Please create one before adding employees.",
    );
  }

  return primaryLocation;
}

function getSingleLocationId(locations: KeypayLocation[]) {
  if (locations.length > 1) {
    throw new Error(
      "Employment Hero has multiple locations configured. Explicit location selection isn't supported yet — remove extra locations or contact support.",
    );
  }

  const primaryLocationId = locations[0]?.id;

  if (!primaryLocationId) {
    throw new Error(
      "Employment Hero has no locations configured. Please create one before adding employees.",
    );
  }

  return primaryLocationId;
}

function getEmployeeHoursDefaults(
  employmentType: KeypayCreateEmployeeInput["employmentType"],
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
  employmentType: KeypayCreateEmployeeInput["employmentType"],
) {
  const isCasual = employmentType === "Casual";
  const requiredRateUnit = isCasual ? "Hourly" : "Annually";
  const payCategory = payCategories.find(
    (item) => item.rateUnit === requiredRateUnit && item.name,
  );

  if (!payCategory?.name) {
    throw new Error(
      isCasual
        ? "No hourly pay category found in Employment Hero. Please create one before adding casual employees."
        : "No annual pay category found in Employment Hero. Please create one before adding salaried employees.",
    );
  }

  return payCategory.name;
}

function flattenPayRunEarningsLines(
  response: RawKeypayPayRunEarningsLinesResponse,
) {
  return Object.values(response.earningsLines ?? {}).flatMap(
    (lines) => lines ?? [],
  );
}

function getPayRunStatus(
  payRun: KeypayPayRun,
  summary: RawKeypayPayRunSummary,
  earningsLines: RawKeypayPayRunEarningsLinesResponse,
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
    (payRate) => payRate.isPrimaryPayCategory,
  );

  if (!primaryPayRate) {
    throw new Error(
      "Employment Hero has no primary pay rate configured for this employee.",
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
      }),
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
      data.employmentType,
    );
    // Employment Hero leaves new employees with hoursPerWeek: 0 and automaticallyPayEmployee: false
    // unless we set them explicitly. Without these, salaried employees will never appear in a
    // calculated pay run. Casuals keep the defaults because their hours are entered per pay run.
    const { hoursPerWeek, automaticallyPayEmployee } = getEmployeeHoursDefaults(
      data.employmentType,
    );

    return await request<KeypayEmployeeWriteResult>({
      path: "/employee/unstructured",
      method: "POST",
      body: {
        ...data,
        employmentType:
          data.employmentType === "FullTime"
            ? "Full Time"
            : data.employmentType === "PartTime"
              ? "Part Time"
              : "Casual",
        taxFileNumber: TFN_PLACEHOLDER,
        primaryLocation,
        primaryPayCategory,
        hoursPerWeek: data.hoursPerWeek ?? hoursPerWeek,
        automaticallyPayEmployee,
      },
    });
  },

  updateEmployee: async (id: number, data: KeypayCreateEmployeeInput) => {
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
      data.employmentType,
    );
    const { hoursPerWeek, automaticallyPayEmployee } = getEmployeeHoursDefaults(
      data.employmentType,
    );

    return await request<KeypayEmployeeWriteResult>({
      path: `/employee/unstructured/${id}`,
      method: "PUT",
      body: {
        ...data,
        employmentType:
          data.employmentType === "FullTime"
            ? "Full Time"
            : data.employmentType === "PartTime"
              ? "Part Time"
              : "Casual",
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
            (rawPayRun) => rawPayRun.payScheduleId === payScheduleId,
          );
    const payScheduleNamesById = new Map(
      paySchedules.map((paySchedule) => [
        paySchedule.id,
        paySchedule.name ?? null,
      ]),
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
      }),
    );
  },

  createPayRun: async (
    payScheduleId: number,
    periodEndingDate: string,
    options: Omit<
      KeypayCreatePayRunInput,
      "payPeriodEnding" | "payScheduleId"
    > = {},
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
      }),
    ),

  getPayRun: async (payRunId: number) =>
    mapPayRun(
      await request<RawKeypayPayRun>({
        path: `/payrun/${payRunId}`,
      }),
    ),

  getPayRunDetails: async (payRunId: number): Promise<KeypayPayRunDetails> => {
    const [details, summary, earningsLines, paySchedules] = await Promise.all([
      request<RawKeypayPayRunDetails>({
        path: `/payrun/${payRunId}/details`,
      }),
      request<RawKeypayPayRunSummary>({
        path: `/payrun/${payRunId}/summary`,
      }),
      request<RawKeypayPayRunEarningsLinesResponse>({
        path: `/payrun/${payRunId}/earningslines`,
      }),
      request<KeypayPaySchedule[]>({
        path: "/payschedule",
      }),
    ]);
    const payRun = mapPayRun(details.payRun);
    const paySchedule = paySchedules.find(
      (item) => item.id === payRun.payScheduleId,
    );
    const employees = details.payRunTotals.map(mapPayRunEmployeeTotal);

    return {
      payRun: {
        ...payRun,
        payScheduleName: paySchedule?.name ?? null,
        status: getPayRunStatus(payRun, summary, earningsLines),
      },
      employees,
      grandTotal: mapPayRunGrandTotal(details.grandTotal),
    };
  },

  // Returns the bank transfer rows for a single employee on a pay run.
  //
  // Scoped to one employee so opening the bank details modal only costs ~2 API calls
  // regardless of how many employees are on the pay run. Finalized pay runs take the
  // authoritative amounts from `/payrun/{id}/payments`; non-finalized pay runs compute
  // the allocation locally from the employee's bank account config.
  getPayRunEmployeeBankPayments: async (
    payRunId: number,
    employeeId: number,
  ): Promise<KeypayPayRunBankPayment[]> => {
    const details = await request<RawKeypayPayRunDetails>({
      path: `/payrun/${payRunId}/details`,
    });

    if (details.payRun.isFinalised) {
      const payments = await request<RawKeypayPayRunBankPayment[]>({
        path: `/payrun/${payRunId}/payments`,
      });

      return payments
        .filter((payment) => payment.employeeId === employeeId)
        .map((payment) => {
          const fullName = `${payment.employeeFirstName ?? ""} ${
            payment.employeeSurname ?? ""
          }`.trim();

          return {
            employeeId: payment.employeeId,
            employeeName: fullName || null,
            bankAccountId: 0,
            accountType:
              (payment.accountType as KeypayPayRunBankPayment["accountType"]) ??
              null,
            bsb: payment.bsb ?? null,
            accountName: payment.accountName ?? null,
            accountNumber: payment.accountNumber ?? null,
            amountInCents: toCents(payment.amount) ?? 0,
          } satisfies KeypayPayRunBankPayment;
        })
        .filter((payment) => payment.amountInCents > 0);
    }

    const rawEmployee = details.payRunTotals.find(
      (total) => total.employeeId === employeeId,
    );

    if (!rawEmployee) {
      return [];
    }

    const accounts = await request<RawKeypayEmployeeBankAccount[]>({
      path: `/employee/${employeeId}/bankaccount`,
    });

    return buildPayRunBankPayments(
      [mapPayRunEmployeeTotal(rawEmployee)],
      new Map([[employeeId, accounts]]),
    );
  },

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
          .filter((employeeId) => Number.isFinite(employeeId)),
      ),
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
        }),
      ),
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
    employeeHours: KeypayCalculatePayRunEmployeeHoursInput[] = [],
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
              "Only hourly employees can have manual hours entered before calculating a pay run.",
            );
          }

          const existingPrimaryEarningsLines = flattenPayRunEarningsLines(
            earningsLines,
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
              }),
            ),
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
        }),
      );
    }

    return await request<null>({
      path: `/payrun/${payRunId}/recalculate`,
      method: "POST",
    });
  },

  finalizePayRun: async (
    payRunId: number,
    options: Omit<KeypayFinalizePayRunOptions, "payRunId"> = {},
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

  // Finalizes the payment summaries for a given financial year. In Australia the
  // EOFY workflow is a two-step process on KeyPay's public AU API: generate (PUT),
  // then publish (POST). Both hit the same `/paymentsummary/{year}` path.
  finalizeEofy: async (financialYearEnding: number) => {
    const generated = await request<KeypayPayRun[] | null>({
      path: `/paymentsummary/${financialYearEnding}`,
      method: "PUT",
    });

    await request<null>({
      path: `/paymentsummary/${financialYearEnding}`,
      method: "POST",
    });

    const generatedCount = Array.isArray(generated) ? generated.length : 0;

    return {
      financialYearEnding,
      generatedCount,
      publishedAt: new Date().toISOString(),
    };
  },

  getPayrollDashboardStats: async (): Promise<KeypayPayrollDashboardStats> => {
    const fiscalYear = getCurrentFinancialYearRange();
    const quarter = getCurrentQuarterRange();

    const [ytdActivity, quarterActivity, payRuns] = await Promise.all([
      request<RawKeypayPayRunActivityEntry[]>({
        path: "/report/payrunactivity",
        searchParams: {
          fromDate: fiscalYear.fromDate,
          toDate: fiscalYear.toDate,
        },
      }),
      request<RawKeypayPayRunActivityEntry[]>({
        path: "/report/payrunactivity",
        searchParams: {
          fromDate: quarter.fromDate,
          toDate: quarter.toDate,
        },
      }),
      request<RawKeypayPayRun[]>({
        path: "/payrun",
      }),
    ]);

    const sumToCents = (
      entries: RawKeypayPayRunActivityEntry[],
      key: keyof RawKeypayPayRunActivityEntry,
    ) => {
      return entries.reduce((total, entry) => {
        const value = entry[key];
        return typeof value === "number"
          ? total + (toCents(value) ?? 0)
          : total;
      }, 0);
    };

    const finalizedPayRuns = payRuns
      .filter((payRun) => payRun.isFinalised)
      .map(mapPayRun)
      .sort((a, b) => {
        const aTime = a.datePaid ? new Date(a.datePaid).getTime() : 0;
        const bTime = b.datePaid ? new Date(b.datePaid).getTime() : 0;
        return bTime - aTime;
      });
    const lastFinalizedPayRun = finalizedPayRuns[0] ?? null;

    return {
      ytdGrossInCents: sumToCents(ytdActivity, "grossEarnings"),
      ytdPaygInCents: sumToCents(ytdActivity, "paygWithholding"),
      ytdSuperInCents: sumToCents(ytdActivity, "superContributions"),
      ytdNetInCents: sumToCents(ytdActivity, "netEarnings"),
      quarterPaygInCents: sumToCents(quarterActivity, "paygWithholding"),
      quarterSuperInCents: sumToCents(quarterActivity, "superContributions"),
      lastFinalizedPayRun: lastFinalizedPayRun
        ? {
            id: lastFinalizedPayRun.id,
            datePaid: lastFinalizedPayRun.datePaid ?? null,
            dateFinalized: lastFinalizedPayRun.dateFinalized,
            payScheduleId: lastFinalizedPayRun.payScheduleId,
          }
        : null,
    };
  },
};

export * from "./types";
