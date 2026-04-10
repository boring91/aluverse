import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { keypayClient } from "../lib/keypay-client";
import {
  createPayrollEmployeeSchema,
  createPayrollPayScheduleSchema,
  keypayEmployeeIdSchema,
  keypayPayRunIdSchema,
  keypayPayScheduleIdSchema,
  keypayDateSchema,
  optionalTrimmedStringSchema,
  updatePayrollEmployeeSchema,
  updatePayrollPayScheduleSchema,
} from "../schemas/payroll.shared-schema";

export const payrollRouter = createTRPCRouter({
  listEmployees: permissionProcedure("payroll.read").query(async () => {
    const items = await keypayClient.listEmployees();

    return {
      items,
      count: items.length,
      filteredCount: items.length,
    };
  }),

  getEmployee: permissionProcedure("payroll.read")
    .input(z.object({ id: keypayEmployeeIdSchema }))
    .query(async ({ input }) => {
      return await keypayClient.getEmployee(input.id);
    }),

  deleteEmployee: permissionProcedure("payroll.write")
    .input(z.object({ id: keypayEmployeeIdSchema }))
    .mutation(async ({ input }) => {
      return await keypayClient.deleteEmployee(input.id);
    }),

  createEmployee: permissionProcedure("payroll.write")
    .input(createPayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.createEmployee(input);
    }),

  updateEmployee: permissionProcedure("payroll.write")
    .input(updatePayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await keypayClient.updateEmployee(id, data);
    }),

  activateEmployee: permissionProcedure("payroll.write")
    .input(z.object({ id: keypayEmployeeIdSchema }))
    .mutation(async ({ input }) => {
      return await keypayClient.activateEmployee(input.id);
    }),

  sendOnboardingEmail: permissionProcedure("payroll.write")
    .input(
      z.object({
        employeeId: keypayEmployeeIdSchema,
        firstName: optionalTrimmedStringSchema,
        surname: optionalTrimmedStringSchema,
        email: z.email(),
        mobile: optionalTrimmedStringSchema,
      })
    )
    .mutation(async ({ input }) => {
      return await keypayClient.sendOnboardingEmail(input);
    }),

  listPaySchedules: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.listPaySchedules();
  }),

  getPaySchedule: permissionProcedure("payroll.read")
    .input(z.object({ id: keypayPayScheduleIdSchema }))
    .query(async ({ input }) => {
      return await keypayClient.getPaySchedule(input.id);
    }),

  createPaySchedule: permissionProcedure("payroll.write")
    .input(createPayrollPayScheduleSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.createPaySchedule(input);
    }),

  updatePaySchedule: permissionProcedure("payroll.write")
    .input(updatePayrollPayScheduleSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.updatePaySchedule(input.id, input);
    }),

  deletePaySchedule: permissionProcedure("payroll.write")
    .input(z.object({ id: keypayPayScheduleIdSchema }))
    .mutation(async ({ input }) => {
      return await keypayClient.deletePaySchedule(input.id);
    }),

  listPayRuns: permissionProcedure("payroll.read")
    .input(
      z
        .object({
          payScheduleId: keypayPayScheduleIdSchema.optional(),
        })
        .default({})
    )
    .query(async ({ input }) => {
      const items = await keypayClient.listPayRuns(input.payScheduleId);

      return {
        items,
        count: items.length,
        filteredCount: items.length,
      };
    }),

  createPayRun: permissionProcedure("payroll.write")
    .input(
      z.object({
        payScheduleId: keypayPayScheduleIdSchema,
        periodEndingDate: keypayDateSchema,
      })
    )
    .mutation(async ({ input }) => {
      return await keypayClient.createPayRun(
        input.payScheduleId,
        input.periodEndingDate
      );
    }),

  getPayRunDetails: permissionProcedure("payroll.read")
    .input(z.object({ payRunId: keypayPayRunIdSchema }))
    .query(async ({ input }) => {
      return await keypayClient.getPayRunDetails(input.payRunId);
    }),

  getPayRunEmployeeBankPayments: permissionProcedure("payroll.read")
    .input(
      z.object({
        payRunId: keypayPayRunIdSchema,
        employeeId: keypayEmployeeIdSchema,
      })
    )
    .query(async ({ input }) => {
      return await keypayClient.getPayRunEmployeeBankPayments(
        input.payRunId,
        input.employeeId
      );
    }),

  getPayRunEmployeeHours: permissionProcedure("payroll.read")
    .input(z.object({ payRunId: keypayPayRunIdSchema }))
    .query(async ({ input }) => {
      return await keypayClient.getPayRunEmployeeHours(input.payRunId);
    }),

  deletePayRun: permissionProcedure("payroll.write")
    .input(z.object({ payRunId: keypayPayRunIdSchema }))
    .mutation(async ({ input }) => {
      return await keypayClient.deletePayRun(input.payRunId);
    }),

  calculatePayRun: permissionProcedure("payroll.write")
    .input(
      z.object({
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
      })
    )
    .mutation(async ({ input }) => {
      return await keypayClient.calculatePayRun(
        input.payRunId,
        input.employeeHours
      );
    }),

  finalizePayRun: permissionProcedure("payroll.write")
    .input(z.object({ payRunId: keypayPayRunIdSchema }))
    .mutation(async ({ input }) => {
      return await keypayClient.finalizePayRun(input.payRunId);
    }),

  getStpStatus: permissionProcedure("payroll.read")
    .input(z.object({ payRunId: keypayPayRunIdSchema }))
    .query(async ({ input }) => {
      return await keypayClient.getStpStatus(input.payRunId);
    }),

  getYtdReport: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.getYtdReport();
  }),

  getSuperContributions: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.getSuperContributions();
  }),

  getDashboardStats: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.getPayrollDashboardStats();
  }),

  finalizeEofy: permissionProcedure("payroll.write")
    .input(
      z.object({
        // Australian financial years end on 30 June and are identified by the ending year.
        // e.g. 2026 represents the FY from 1 July 2025 to 30 June 2026.
        financialYearEnding: z.number().int().min(2000).max(2100),
      })
    )
    .mutation(async ({ input }) => {
      return await keypayClient.finalizeEofy(input.financialYearEnding);
    }),
});
