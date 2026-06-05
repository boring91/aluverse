import { z } from "zod";
import { employmentTypes } from "@/lib/constants";

function toKeypayDateString(value: Date) {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  ).toISOString();
}

export const keypayDateSchema = z.date().transform(toKeypayDateString);

export const optionalTrimmedStringSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => {
    return value ? value : undefined;
  });

export const optionalEmailSchema = optionalTrimmedStringSchema.refine(
  (value) => !value || z.email().safeParse(value).success,
  {
    message: "Invalid email address",
  }
);

export const optionalKeypayDateSchema = z
  .date()
  .nullable()
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return toKeypayDateString(value);
  });

export const keypayEmployeeIdSchema = z.number().int().positive();

export const keypayPayScheduleIdSchema = z.number().int().positive();

export const keypayPayRunIdSchema = z.number().int().positive();

const createPayrollEmployeeBaseSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  emailAddress: optionalEmailSchema,
  employmentType: z.enum(employmentTypes),
  rate: z.number().positive(),
});

export const createPayrollEmployeeFormSchema =
  createPayrollEmployeeBaseSchema.safeExtend({
    payScheduleId: z.string().min(1),
    startDate: z.date(),
  });

export const createPayrollEmployeeSchema =
  createPayrollEmployeeBaseSchema.safeExtend({
    startDate: keypayDateSchema,
    mobilePhone: optionalTrimmedStringSchema,
    endDate: optionalKeypayDateSchema,
    externalId: optionalTrimmedStringSchema,
    paySchedule: optionalTrimmedStringSchema,
    rateUnit: optionalTrimmedStringSchema,
    hoursPerWeek: z.number().nullable().optional(),
  });

export const updatePayrollEmployeeSchema =
  createPayrollEmployeeSchema.safeExtend({
    id: keypayEmployeeIdSchema,
  });

export const createPayrollPayScheduleSchema = z.object({
  name: z.string().trim().min(1),
  frequency: z.enum(["Weekly", "Fortnightly", "Monthly", "AdHoc"]),
  employeeSelectionStrategy: z.enum([
    "None",
    "PayRunDefault",
    "TimesheetLocations",
    "PayRunDefaultWithTimesheets",
    "ActiveSubcontractors",
    "EmployingEntity",
  ]),
  equalMonthlyPayments: z.boolean(),
});

export const updatePayrollPayScheduleSchema =
  createPayrollPayScheduleSchema.safeExtend({
    id: keypayPayScheduleIdSchema,
  });

export const createPayrollPayRunFormSchema = z.object({
  payScheduleId: z.string().min(1),
  periodEndingDate: z.date(),
});

export const payrollPayRunFiltersSchema = z.object({
  payScheduleId: z.string().optional(),
});
