import { z } from "zod";
import { employmentTypes } from "@/lib/constants";

function toKeypayDateString(value: Date) {
  return new Date(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate())
  ).toISOString();
}

const keypayDateSchema = z.date().transform(toKeypayDateString);

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

const createPayrollEmployeeBaseSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  emailAddress: z.email(),
  employmentType: z.enum(employmentTypes),
  rate: z.number().positive(),
});

export const getPayrollEmployeeSchema = z.object({
  id: keypayEmployeeIdSchema,
});

export const createPayrollEmployeeFormSchema =
  createPayrollEmployeeBaseSchema.safeExtend({
    payScheduleId: z.string().min(1),
    startDate: z.date(),
  });

export const createPayrollEmployeeSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  emailAddress: z.email(),
  employmentType: z.enum(employmentTypes),
  startDate: keypayDateSchema,
  mobilePhone: z.string().trim().min(1).nullable().optional(),
  endDate: optionalKeypayDateSchema,
  externalId: z.string().trim().min(1).nullable().optional(),
  paySchedule: z.string().trim().min(1).nullable().optional(),
  primaryPayCategory: z.string().trim().min(1).nullable().optional(),
  primaryLocation: z.string().trim().min(1).nullable().optional(),
  rate: z.number().positive().nullable().optional(),
  rateUnit: z.string().trim().min(1).nullable().optional(),
  hoursPerWeek: z.number().nullable().optional(),
});

export const getPayrollOnboardingUrlSchema = z.object({
  employeeId: keypayEmployeeIdSchema,
});

export const listPayrollPayRunsSchema = z
  .object({
    payScheduleId: keypayPayScheduleIdSchema.optional(),
  })
  .default({});

export const createPayrollPayRunSchema = z.object({
  payScheduleId: keypayPayScheduleIdSchema,
  periodEndingDate: keypayDateSchema,
});

export const calculatePayrollPayRunSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});

export const finalizePayrollPayRunSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});

export const getPayrollStpStatusSchema = z.object({
  payRunId: keypayPayRunIdSchema,
});
