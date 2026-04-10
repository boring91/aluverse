import { z } from "zod";

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
      return value ?? null;
    }

    return toKeypayDateString(value);
  });

const keypayEmployeeIdSchema = z.coerce.number().int().positive();

const keypayPayScheduleIdSchema = z.coerce.number().int().positive();

const keypayPayRunIdSchema = z.coerce.number().int().positive();

export const getPayrollEmployeeSchema = z.object({
  id: keypayEmployeeIdSchema,
});

export const createPayrollEmployeeSchema = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  startDate: keypayDateSchema,
  employmentType: z.string().trim().min(1),
  emailAddress: z.email().nullable().optional(),
  mobilePhone: z.string().trim().min(1).nullable().optional(),
  endDate: optionalKeypayDateSchema,
  externalId: z.string().trim().min(1).nullable().optional(),
  paySchedule: z.string().trim().min(1).nullable().optional(),
  primaryPayCategory: z.string().trim().min(1).nullable().optional(),
  primaryLocation: z.string().trim().min(1).nullable().optional(),
  rate: z.number().nullable().optional(),
  rateUnit: z.string().trim().min(1).nullable().optional(),
  hoursPerWeek: z.number().nullable().optional(),
});

export const getPayrollOnboardingUrlSchema = z.object({
  employeeId: keypayEmployeeIdSchema,
  employingEntityId: z.number().int().positive().nullable().optional(),
  title: z.number().int().positive().nullable().optional(),
  firstName: z.string().trim().min(1).nullable().optional(),
  surname: z.string().trim().min(1).nullable().optional(),
  email: z.email().nullable().optional(),
  mobile: z.string().trim().min(1).nullable().optional(),
  qualificationsRequired: z.boolean().nullable().optional(),
  emergencyContactDetailsRequired: z.boolean().nullable().optional(),
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
