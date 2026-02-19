import { createTRPCRouter } from "../init";
import { financialAccountsRouter } from "@/features/financial-accounts/api/financial-accounts.router";
import { transactionsRouter } from "@/features/financial-accounts/api/transactions.router";
import { consolidationsRouter } from "@/features/consolidations/api/consolidations.router";
import { projectsRouter } from "@/features/projects/api/projects.router";
import { projectSuppliesRouter } from "@/features/projects/api/project-supplies.router";
import { projectLaborsRouter } from "@/features/projects/api/project-labors.router";
import { projectMiscRouter } from "@/features/projects/api/project-misc.router";
import { projectPaymentsRouter } from "@/features/projects/api/project-payments.router";
import { loansRouter } from "@/features/loans/api/loans.router";
import { loanPayoffsRouter } from "@/features/loans/api/loan-payoffs.router";
import { dashboardRouter } from "@/features/dashboard/api/dashboard.router";
import { rbacRouter } from "@/features/rbac/api/rbac.router";

export const appRouter = createTRPCRouter({
  financialAccounts: financialAccountsRouter,
  transactions: transactionsRouter,
  consolidations: consolidationsRouter,
  projects: projectsRouter,
  projectSupplies: projectSuppliesRouter,
  projectLabors: projectLaborsRouter,
  projectMisc: projectMiscRouter,
  projectPayments: projectPaymentsRouter,
  loans: loansRouter,
  loanPayoffs: loanPayoffsRouter,
  dashboard: dashboardRouter,
  rbac: rbacRouter,
});

export type AppRouter = typeof appRouter;
