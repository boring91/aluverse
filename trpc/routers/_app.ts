import { createTRPCRouter } from "../init";
import { financialAccountsRouter } from "./financial-accounts";
import { transactionsRouter } from "./transactions";
export const appRouter = createTRPCRouter({
    financialAccounts: financialAccountsRouter,
    transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
