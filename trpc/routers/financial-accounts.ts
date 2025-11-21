import { db, financialAccounts } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { desc } from "drizzle-orm";

export const financialAccountsRouter = createTRPCRouter({
    list: protectedProcedure.query(async () => {
        return await db.query.financialAccounts.findMany({
            orderBy: [desc(financialAccounts.updatedAt)],
        });
    }),
});
