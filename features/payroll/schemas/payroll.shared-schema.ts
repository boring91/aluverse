import { z } from "zod";
import { employmentTypes } from "@/lib/constants";

function toKeypayDateString(value: Date) {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  ).toISOString();
}

const keypayDateSchema = z.date().transform(toKeypayDateString);

const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    return value ? value : undefined;
  });

const optionalEmailSchema = optionalTrimmedStringSchema.refine(
  (value) => !value || z.email().safeParse(value).success,
  {
    message: "Invalid email address",
  }
);

const optionalKeypayDateSchema = z
  .date()
  .nullable()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return toKeypayDateString(value);
  });

const keypayEmployeeIdSchema = z.number().int().positive();

const keypayPayScheduleIdSchema = z.number().int().positive();

const keypayPayRunIdSchema = z.number().int().positive();

const payScheduleFrequencySchema = z.enum([
  "Weekly",
  "Fortnightly",
  "Monthly",
  "AdHoc",
]);

const payScheduleEmployeeSelectionStrategySchema = z.enum([
  "None",
  "PayRunDefault",
  "TimesheetLocations",
  "PayRunDefaultWithTimesheets",
  "ActiveSubcontractors",
  "EmployingEntity",
]);

const createPayrollEmployeeBaseSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  emailAddress: optionalEmailSchema,
  employmentType: z.enum(employmentTypes),
  rate: z.number().positive(),
});

export const getPayrollEmployeeSchema = z.object({
  id: keypayEmployeeIdSchema,
});

export const getPayrollPayScheduleSchema = z.object({
  id: keypayPayScheduleIdSchema,
});

export const createPayrollEmployeeFormSchema =
  createPayrollEmployeeBaseSchema.safeExtend({
    payScheduleId: z.string().min(1),
    startDate: z.date(),
  });

export const createPayrollEmployeeSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  emailAddress: optionalEmailSchema,
  employmentType: z.enum(employmentTypes),
  startDate: keypayDateSchema,
  mobilePhone: optionalTrimmedStringSchema,
  endDate: optionalKeypayDateSchema,
  externalId: optionalTrimmedStringSchema,
  paySchedule: optionalTrimmedStringSchema,
  rate: z.number().positive(),
  rateUnit: optionalTrimmedStringSchema,
  hoursPerWeek: z.number().nullable().optional(),
});

export const createPayrollPayScheduleSchema = z.object({
  name: z.string().trim().min(1),
  frequency: payScheduleFrequencySchema,
  employeeSelectionStrategy: payScheduleEmployeeSelectionStrategySchema,
  equalMonthlyPayments: z.boolean(),
});

export const updatePayrollPayScheduleSchema =
  createPayrollPayScheduleSchema.safeExtend({
    id: keypayPayScheduleIdSchema,
  });

export const activatePayrollEmployeeSchema = z.object({
  id: keypayEmployeeIdSchema,
});

export const sendPayrollOnboardingEmailSchema = z.object({
  employeeId: keypayEmployeeIdSchema,
  firstName: optionalTrimmedStringSchema,
  surname: optionalTrimmedStringSchema,
  email: z.email(),
  mobile: optionalTrimmedStringSchema,
});

export const listPayrollPayRunsSchema = z
  .object({
    payScheduleId: keypayPayScheduleIdSchema.optional(),
  })
  .default({});

export const payrollPayRunFiltersSchema = z.object({
  payScheduleId: z.string().optional(),
});

export const getPayrollPayRunSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});

export const createPayrollPayRunFormSchema = z.object({
  payScheduleId: z.string().min(1),
  periodEndingDate: z.date(),
});

export const createPayrollPayRunSchema = z.object({
  payScheduleId: keypayPayScheduleIdSchema,
  periodEndingDate: keypayDateSchema,
});

export const calculatePayrollPayRunSchema = z.object({
  payRunId: keypayPayRunIdSchema,
  employeeHours: z
    .array(
      z.object({
        employeeId: keypayEmployeeIdSchema,
        units: z.number().min(0),
      })
    )
    .optional()
    .default([]),
});

export const finalizePayrollPayRunSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});

export const getPayrollStpStatusSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});
