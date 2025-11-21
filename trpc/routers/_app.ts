import { createTRPCRouter } from "../init";
import { financialAccountsRouter } from "./financial-accounts";
export const appRouter = createTRPCRouter({
    financialAccounts: financialAccountsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
