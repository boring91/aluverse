import { db, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { count, desc, asc, eq, sql, ilike, and } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/trpc-schemas";

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            z.object({
                accountId: z.uuid(),
                pagination: z
                    .object({
                        pageIndex: z.number(),
                        pageSize: z.number(),
                    })
                    .default({ pageIndex: 0, pageSize: 20 }),
                sorting: z
                    .array(
                        z.object({
                            id: z.string(),
                            desc: z.boolean(),
                        })
                    )
                    .optional(),
                columnFilters: z
                    .array(
                        z.object({
                            id: z.string(),
                            value: z.unknown(),
                        })
                    )
                    .optional(),
            })
        )
        .query(async ({ input }) => {
            const { accountId, pagination, sorting, columnFilters } = input;

            const filters = [eq(transactions.accountId, accountId)];

            if (columnFilters) {
                for (const filter of columnFilters) {
                    if (
                        filter.id === "description" &&
                        typeof filter.value === "string"
                    ) {
                        filters.push(
                            ilike(transactions.description, `%${filter.value}%`)
                        );
                    }
                }
            }

            const orderBy = [];
            if (sorting && sorting.length > 0) {
                sorting.forEach(sort => {
                    const direction = sort.desc ? desc : asc;
                    switch (sort.id) {
                        case "date":
                            orderBy.push(direction(transactions.date));
                            break;
                        case "description":
                            orderBy.push(direction(transactions.description));
                            break;
                        case "amount":
                            orderBy.push(direction(transactions.amount));
                            break;
                        default:
                            orderBy.push(desc(transactions.createdAt));
                    }
                });
            } else {
                orderBy.push(desc(transactions.createdAt));
            }

            const { pageIndex, pageSize } = pagination;
            const items = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    amount: sql<number>`${transactions.amount}`,
                    type: transactions.type,
                    description: transactions.description,
                })
                .from(transactions)
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { c } = (
                await db
                    .select({ c: count() })
                    .from(transactions)
                    .where(and(...filters))
            )[0];

            return {
                items,
                count: c,
            };
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const items = await db
                .select({
                    id: transactions.id,
                    date: transactions.date,
                    amount: sql<number>`${transactions.amount}`,
                    type: transactions.type,
                    description: transactions.description,
                })
                .from(transactions)
                .where(eq(transactions.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createTransactionSchema
                .extend({
                    accountId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(transactions).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createTransactionSchema
                .extend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(transactions)
                .set(input)
                .where(eq(transactions.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(transactions)
                .where(eq(transactions.id, input.id))
                .returning();
        }),
});
