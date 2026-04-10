import { employmentTypes } from "@/lib/constants";

type KeypayMoneyInCents = number;

export type KeypayEmploymentType = (typeof employmentTypes)[number];

export type KeypayProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
} & Record<string, unknown>;

export type RawKeypayEmployee = {
  id: number;
  title?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  surname?: string | null;
  preferredName?: string | null;
  dateOfBirth?: string | null;
  externalId?: string | null;
  emailAddress?: string | null;
  homePhone?: string | null;
  workPhone?: string | null;
  mobilePhone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  employmentType?: KeypayEmploymentType | null;
  paySchedule?: string | null;
  primaryPayCategory?: string | null;
  primaryLocation?: string | null;
  rate?: number | null;
  rateUnit?: string | null;
  hoursPerWeek?: number | null;
  status?: "Active" | "Terminated" | "Incomplete" | null;
  dateCreated?: string | null;
  taxFileNumber?: string | null;
  bankAccount1_BSB?: string | null;
  bankAccount1_AccountNumber?: string | null;
  superFund1_FundName?: string | null;
};

export type KeypayEmployee = Omit<
  RawKeypayEmployee,
  | "rate"
  | "taxFileNumber"
  | "bankAccount1_BSB"
  | "bankAccount1_AccountNumber"
  | "superFund1_FundName"
> & {
  rateInCents: KeypayMoneyInCents | null;
  hasCompletedOnboarding: boolean;
};

export type KeypayCreateEmployeeInput = {
  firstName: string;
  surname: string;
  startDate: string;
  employmentType: KeypayEmploymentType;
  emailAddress?: string | null;
  mobilePhone?: string | null;
  endDate?: string | null;
  externalId?: string | null;
  paySchedule?: string | null;
  primaryPayCategory?: string | null;
  primaryLocation?: string | null;
  rate?: number | null;
  rateUnit?: string | null;
  hoursPerWeek?: number | null;
};

export type KeypayEmployeeWriteResult = {
  id: number;
  status?: string | null;
  detailedStatus?: string | null;
};

export type KeypaySendOnboardingEmailInput = {
  employeeId: number;
  firstName?: string | null;
  surname?: string | null;
  email: string;
  mobile?: string | null;
};

export type KeypaySendOnboardingEmailResult = {
  email: string;
};

export type KeypayPaySchedule = {
  id: number;
  name?: string | null;
  frequency?: "Weekly" | "Fortnightly" | "Monthly" | "AdHoc" | "Initial" | null;
  employeeSelectionStrategy?:
    | "None"
    | "PayRunDefault"
    | "TimesheetLocations"
    | "PayRunDefaultWithTimesheets"
    | "ActiveSubcontractors"
    | "EmployingEntity"
    | null;
  lastDatePaid?: string | null;
  lastPayRun?: string | null;
  externalId?: string | null;
  source?: string | null;
  locations?: number[] | null;
  equalMonthlyPayments?: boolean | null;
};

export type KeypayPayScheduleWriteInput = {
  name: string;
  frequency: "Weekly" | "Fortnightly" | "Monthly" | "AdHoc";
  employeeSelectionStrategy:
    | "None"
    | "PayRunDefault"
    | "TimesheetLocations"
    | "PayRunDefaultWithTimesheets"
    | "ActiveSubcontractors"
    | "EmployingEntity";
  equalMonthlyPayments: boolean;
};

export type KeypayPayRunStatus = "Draft" | "Calculated" | "Finalized";

export type RawKeypayPayRun = {
  id: number;
  dateFinalised?: string | null; // cspell:words Finalised
  payScheduleId: number;
  payPeriodStarting?: string | null;
  payPeriodEnding?: string | null;
  datePaid?: string | null;
  isFinalised: boolean; // cspell:words Finalised
  paySlipsPublished: boolean;
  notation?: string | null;
  externalId?: string | null;
};

export type KeypayPayRun = Omit<
  RawKeypayPayRun,
  "dateFinalised" | "isFinalised"
> & {
  dateFinalized: string | null;
  isFinalized: boolean;
};

export type RawKeypayPayRunSummary = {
  totalHours?: number | null;
  totalNetWages?: number | null;
  totalGrossWages?: number | null;
  id: number;
  payScheduleId: number;
  payPeriodStarting?: string | null;
  payPeriodEnding?: string | null;
  datePaid?: string | null;
  paySlipsPublished: boolean;
  notation?: string | null;
  externalId?: string | null;
};

export type KeypayPayRunListItem = KeypayPayRun & {
  payScheduleName: string | null;
  totalHours: number | null;
  totalNetWagesInCents: KeypayMoneyInCents | null;
  totalGrossWagesInCents: KeypayMoneyInCents | null;
  status: KeypayPayRunStatus;
};

export type KeypayCreatePayRunInput = {
  payScheduleId: number;
  payPeriodEnding: string;
  datePaid?: string | null;
  timesheetImportOption?:
    | "None"
    | "ThisPayPeriod"
    | "AllOutstanding"
    | "CustomPeriod"
    | null;
  externalId?: string | null;
  callbackUrl?: string | null;
  createWithEmptyPays?: boolean | null;
  adhoc?: boolean | null;
  includeTerminatedEmployees?: boolean | null;
};

export type KeypayEmployeePayRate = {
  hasSuperRateOverride?: boolean | null;
  superRate?: number | null;
  payCategoryId: number;
  payCategoryName?: string | null;
  isPrimaryPayCategory: boolean;
  accruesLeave?: boolean | null;
  rateUnit?: string | null;
  rate: number;
  calculatedRate?: number | null;
};

export type RawKeypayPayRunEarningsLine = {
  id: number;
  payCategoryId?: string | null;
  payCategoryName?: string | null;
  units?: number | null;
  rate?: number | null;
  earnings?: number | null;
  isSystemGenerated?: boolean | null;
  locationId?: string | null;
  locationName?: string | null;
  employeeId?: string | null;
  employeeName?: string | null;
};

export type RawKeypayPayRunEarningsLinesResponse = {
  earningsLines?: Record<string, RawKeypayPayRunEarningsLine[] | null> | null;
  payRunId: number;
};

export type KeypayCalculatePayRunEmployeeHoursInput = {
  employeeId: number;
  units: number;
};

export type KeypayStpStatus = {
  status: string | null;
  detail: string | null;
  jobId: string | null;
};

export type KeypayFinalizePayRunOptions = {
  payRunId?: number | null;
  datePaid?: string | null;
  exportJournals?: boolean | null;
  publishPaySlips?: "Manual" | "Immediate" | "Scheduled" | null;
  publishPaySlipsDateTime?: string | null;
  suppressNotifications?: boolean | null;
  lodgePayRun?: boolean | null;
  lodgePayRunInTestMode?: boolean | null;
  lodgeFinalPayRun?: boolean | null;
  finaliseAsAdmin?: boolean | null;
  saveChangesToDefaultSettings?: boolean | null;
  fromPayRunAutomation?: boolean | null;
};

export type KeypaySuperPayment = {
  superInterchangeId: number;
  description?: string | null;
  clearingHouse?: "Click" | "Beam" | "Manual" | "HeroClear" | null;
  status?: string | null;
};

export type KeypayFinalizePayRunResult = {
  paySlipsPublished?: boolean | null;
  publishPreference?: "Manual" | "Immediate" | "Scheduled" | null;
  datePaid?: string | null;
  payRunLodgementJobId?: string | null;
  activeEmployees?: number | null;
  lodgePayRun?: "Manual" | "Immediate" | "Scheduled" | null;
  lodgePayRunScheduledDateTimeUtc?: string | null;
  superPayments: KeypaySuperPayment[];
  isFirstFinalisation?: boolean | null;
};

export type RawKeypayYtdReportEntry = {
  bsb?: string | null; // cspell:words bsb
  employeeId: number;
  firstName?: string | null;
  surname?: string | null;
  externalId?: string | null;
  datePaid?: string | null;
  locationName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  accountType?: string | null;
  taxableEarnings?: number | null;
  netEarnings?: number | null;
  totalAllowances?: number | null;
  totalDeductions?: number | null;
  amount?: number | null;
};

export type KeypayYtdReportEntry = Omit<
  RawKeypayYtdReportEntry,
  | "taxableEarnings"
  | "netEarnings"
  | "totalAllowances"
  | "totalDeductions"
  | "amount"
> & {
  taxableEarningsInCents: KeypayMoneyInCents | null;
  netEarningsInCents: KeypayMoneyInCents | null;
  totalAllowancesInCents: KeypayMoneyInCents | null;
  totalDeductionsInCents: KeypayMoneyInCents | null;
  amountInCents: KeypayMoneyInCents | null;
};

export type RawKeypaySuperContribution = {
  locationId: number;
  locationName?: string | null;
  employeeId: number;
  firstName?: string | null;
  surname?: string | null;
  externalId?: string | null;
  accrualDate?: string | null;
  accrualType?: string | null;
  accrualAmount?: number | null;
  batchId?: number | null;
  status?: string | null;
};

export type KeypaySuperContribution = Omit<
  RawKeypaySuperContribution,
  "accrualAmount"
> & {
  accrualAmountInCents: KeypayMoneyInCents | null;
};
