import { createTRPCRouter } from "../init";
import { budgetCategoriesRouter } from "@/features/budget/api/budget-categories.router";
import { budgetCategoryAllocationsRouter } from "@/features/budget/api/budget-category-allocations.router";
import { financialAccountsRouter } from "@/features/financial-accounts/api/financial-accounts.router";
import { transactionsRouter } from "@/features/financial-accounts/api/transactions.router";
import { reconciliationsRouter } from "@/features/reconciliations/api/reconciliations.router";
import { projectsRouter } from "@/features/projects/api/projects.router";
import { projectSuppliesRouter } from "@/features/projects/api/project-supplies.router";
import { projectLaborsRouter } from "@/features/projects/api/project-labors.router";
import { projectMiscRouter } from "@/features/projects/api/project-misc.router";
import { projectPaymentsRouter } from "@/features/projects/api/project-payments.router";
import { loansRouter } from "@/features/loans/api/loans.router";
import { loanPayoffsRouter } from "@/features/loans/api/loan-payoffs.router";
import { dashboardRouter } from "@/features/dashboard/api/dashboard.router";
import { gstRouter } from "@/features/gst/api/gst.router";
import { rbacRouter } from "@/features/rbac/api/rbac.router";
import { usersRouter } from "@/features/users/api/users.router";

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
});

export type AppRouter = typeof appRouter;
