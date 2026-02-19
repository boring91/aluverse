import { createTRPCRouter } from "../init";
import {
  financialAccountsRouter,
  transactionsRouter,
} from "@/features/financial-accounts";
import { consolidationsRouter } from "@/features/consolidations";
import {
  projectsRouter,
  projectSuppliesRouter,
  projectLaborsRouter,
  projectMiscRouter,
  projectPaymentsRouter,
} from "@/features/projects";
import { loansRouter, loanPayoffsRouter } from "@/features/loans";
import { dashboardRouter } from "@/features/dashboard";
import { rbacRouter } from "@/features/rbac";

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
