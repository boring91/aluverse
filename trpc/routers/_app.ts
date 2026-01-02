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
});

export type AppRouter = typeof appRouter;
