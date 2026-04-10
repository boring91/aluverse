import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { keypayClient } from "../lib/keypay-client";
import {
  calculatePayrollPayRunSchema,
  createPayrollEmployeeSchema,
  createPayrollPayScheduleSchema,
  createPayrollPayRunSchema,
  finalizePayrollPayRunSchema,
  getPayrollEmployeeSchema,
  getPayrollPayScheduleSchema,
  getPayrollStpStatusSchema,
  listPayrollPayRunsSchema,
  sendPayrollOnboardingEmailSchema,
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
    .input(getPayrollEmployeeSchema)
    .query(async ({ input }) => {
      return await keypayClient.getEmployee(input.id);
    }),

  deleteEmployee: permissionProcedure("payroll.write")
    .input(getPayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.deleteEmployee(input.id);
    }),

  createEmployee: permissionProcedure("payroll.write")
    .input(createPayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.createEmployee(input);
    }),

  sendOnboardingEmail: permissionProcedure("payroll.write")
    .input(sendPayrollOnboardingEmailSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.sendOnboardingEmail(input);
    }),

  listPaySchedules: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.listPaySchedules();
  }),

  getPaySchedule: permissionProcedure("payroll.read")
    .input(getPayrollPayScheduleSchema)
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
    .input(getPayrollPayScheduleSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.deletePaySchedule(input.id);
    }),

  listPayRuns: permissionProcedure("payroll.read")
    .input(listPayrollPayRunsSchema)
    .query(async ({ input }) => {
      return await keypayClient.listPayRuns(input.payScheduleId);
    }),

  createPayRun: permissionProcedure("payroll.write")
    .input(createPayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.createPayRun(
        input.payScheduleId,
        input.periodEndingDate
      );
    }),

  calculatePayRun: permissionProcedure("payroll.write")
    .input(calculatePayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.calculatePayRun(input.payRunId);
    }),

  finalizePayRun: permissionProcedure("payroll.write")
    .input(finalizePayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.finalizePayRun(input.payRunId);
    }),

  getStpStatus: permissionProcedure("payroll.read")
    .input(getPayrollStpStatusSchema)
    .query(async ({ input }) => {
      return await keypayClient.getStpStatus(input.payRunId);
    }),

  getYtdReport: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.getYtdReport();
  }),

  getSuperContributions: permissionProcedure("payroll.read").query(async () => {
    return await keypayClient.getSuperContributions();
  }),
});
