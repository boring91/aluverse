import { createTRPCRouter } from "../init";
import { financialAccountsRouter } from "./financial-accounts-router";
import { projectLaborsRouter } from "./project-labors-router";
import { projectSuppliesRouter } from "./project-supplies-router";
import { projectsRouter } from "./projects-router";
import { transactionsRouter } from "./transactions-router";
export const appRouter = createTRPCRouter({
    financialAccounts: financialAccountsRouter,
    transactions: transactionsRouter,
    projects: projectsRouter,
    projectSupplies: projectSuppliesRouter,
    projectLabors: projectLaborsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
