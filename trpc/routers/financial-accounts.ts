import { db, financialAccounts } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

export const financialAccountsRouter = createTRPCRouter({
    list: protectedProcedure.query(async () => {
        return await db.query.financialAccounts.findMany({
            orderBy: [desc(financialAccounts.updatedAt)],
        });
    }),

    get: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
            })
        )
        .query(async ({ input }) => {
            return await db.query.financialAccounts.findFirst({
                where: eq(financialAccounts.id, input.id),
            });
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            return await db.insert(financialAccounts).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
                name: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            return await db
                .update(financialAccounts)
                .set(input)
                .where(eq(financialAccounts.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(
            z.object({
                id: z.uuid(),
            })
        )
        .mutation(async ({ input }) => {
            return await db
                .delete(financialAccounts)
                .where(eq(financialAccounts.id, input.id))
                .returning();
        }),
});
