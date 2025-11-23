import { createTRPCRouter } from "../init";
import { financialAccountsRouter } from "./financial-accounts-router";
import { projectsRouter } from './projects-router';
import { transactionsRouter } from "./transactions-router";
export const appRouter = createTRPCRouter({
    financialAccounts: financialAccountsRouter,
    transactions: transactionsRouter,
    projects: projectsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
