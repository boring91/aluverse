import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { keypayClient } from "../lib/keypay-client";
import {
  activatePayrollEmployeeSchema,
  calculatePayrollPayRunSchema,
  createPayrollEmployeeSchema,
  createPayrollPayScheduleSchema,
  createPayrollPayRunSchema,
  finalizePayrollPayRunSchema,
  getPayrollEmployeeSchema,
  getPayrollPayRunSchema,
  getPayrollPayScheduleSchema,
  getPayrollStpStatusSchema,
  listPayrollPayRunsSchema,
  sendPayrollOnboardingEmailSchema,
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

  updateEmployee: permissionProcedure("payroll.write")
    .input(updatePayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await keypayClient.updateEmployee(id, data);
    }),

  activateEmployee: permissionProcedure("payroll.write")
    .input(activatePayrollEmployeeSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.activateEmployee(input.id);
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
      const items = await keypayClient.listPayRuns(input.payScheduleId);

      return {
        items,
        count: items.length,
        filteredCount: items.length,
      };
    }),

  createPayRun: permissionProcedure("payroll.write")
    .input(createPayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.createPayRun(
        input.payScheduleId,
        input.periodEndingDate
      );
    }),

  getPayRunDetails: permissionProcedure("payroll.read")
    .input(getPayrollPayRunSchema)
    .query(async ({ input }) => {
      return await keypayClient.getPayRunDetails(input.payRunId);
    }),

  getPayRunEmployeeHours: permissionProcedure("payroll.read")
    .input(getPayrollPayRunSchema)
    .query(async ({ input }) => {
      return await keypayClient.getPayRunEmployeeHours(input.payRunId);
    }),

  deletePayRun: permissionProcedure("payroll.write")
    .input(getPayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.deletePayRun(input.payRunId);
    }),

  calculatePayRun: permissionProcedure("payroll.write")
    .input(calculatePayrollPayRunSchema)
    .mutation(async ({ input }) => {
      return await keypayClient.calculatePayRun(
        input.payRunId,
        input.employeeHours
      );
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
