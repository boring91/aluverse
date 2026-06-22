import { budgetCategoriesRouter } from "@/features/budget/apis/budget-categories.router";
import { budgetCategoryAllocationsRouter } from "@/features/budget/apis/budget-category-allocations.router";
import { dashboardRouter } from "@/features/dashboard/apis/dashboard.router";
import { financialAccountsRouter } from "@/features/financial-accounts/apis/financial-accounts.router";
import { transactionsRouter } from "@/features/financial-accounts/apis/transactions.router";
import { gstRouter } from "@/features/gst/apis/gst.router";
import { loanPayoffsRouter } from "@/features/loans/apis/loan-payoffs.router";
import { loansRouter } from "@/features/loans/apis/loans.router";
import { payrollRouter } from "@/features/payroll/apis/payroll.router";
import { projectLaborsRouter } from "@/features/projects/apis/project-labors.router";
import { projectMiscRouter } from "@/features/projects/apis/project-misc.router";
import { projectPaymentsRouter } from "@/features/projects/apis/project-payments.router";
import { projectsRouter } from "@/features/projects/apis/projects.router";
import { projectSuppliesRouter } from "@/features/projects/apis/project-supplies.router";
import { rbacRouter } from "@/features/rbac/apis/rbac.router";
import { reconciliationsRouter } from "@/features/reconciliations/apis/reconciliations.router";
import { usersRouter } from "@/features/users/apis/users.router";
import { createTRPCRouter } from "./init";

export const appRouter = createTRPCRouter({
  budgetCategories: budgetCategoriesRouter,
  budgetCategoryAllocations: budgetCategoryAllocationsRouter,
  financialAccounts: financialAccountsRouter,
  transactions: transactionsRouter,
  reconciliations: reconciliationsRouter,
  projects: projectsRouter,
  projectSupplies: projectSuppliesRouter,
  projectLabors: projectLaborsRouter,
  projectMisc: projectMiscRouter,
  projectPayments: projectPaymentsRouter,
  loans: loansRouter,
  loanPayoffs: loanPayoffsRouter,
  dashboard: dashboardRouter,
  gst: gstRouter,
  rbac: rbacRouter,
  users: usersRouter,
  payroll: payrollRouter,
});

export type AppRouter = typeof appRouter;
