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

export const appRouter = createTRPCRouter({
    financialAccounts: financialAccountsRouter,
    transactions: transactionsRouter,
    consolidations: consolidationsRouter,
    projects: projectsRouter,
    projectSupplies: projectSuppliesRouter,
    projectLabors: projectLaborsRouter,
    projectMisc: projectMiscRouter,
    projectPayments: projectPaymentsRouter,
});

export type AppRouter = typeof appRouter;
