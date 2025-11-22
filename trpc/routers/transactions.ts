import { db, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            z.object({
                accountId: z.uuid(),
                pageNumber: z.number().optional(),
                pageSize: z.number().optional(),
            })
        )
        .query(async ({ input }) => {
            const { accountId, pageNumber, pageSize } = input;

            return await db.query.transactions.findMany({
                where: eq(transactions.accountId, accountId),
                orderBy: [desc(transactions.createdAt)],
                offset: (pageNumber ?? 0) * (pageSize ?? 0),
                limit: pageSize,
            });
        }),
});
