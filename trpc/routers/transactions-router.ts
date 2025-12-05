import { db, projects, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { count, desc, asc, eq, ilike, and, isNull } from "drizzle-orm";
import {
    consolidationSchema,
    createTransactionSchema,
} from "@/lib/trpc-schemas";
import { listSchema } from "@/lib/util-schemas";

const projection = {
    id: transactions.id,
    date: transactions.date,
    amount: transactions.amount,
    type: transactions.type,
    description: transactions.description,
    consolidationGroup: transactions.consolidationGroup,
    budgetCategory: transactions.budgetCategory,
    isGst: transactions.isGst,
    project: {
        id: projects.id,
        title: projects.title,
        humanId: projects.humanId,
    },
} as const;

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                accountId: z.string().optional(),
            })
        )
        .query(async ({ input }) => {
            const { accountId, pagination, sorting, columnFilters } = input;

            const filters = accountId
                ? [eq(transactions.accountId, accountId)]
                : [];

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
                .select(projection)
                .from(transactions)
                .leftJoin(projects, eq(projects.id, transactions.projectId))
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { filteredCount } = (
                await db.select({ filteredCount: count() }).from(transactions)
            )[0];

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(transactions)
                    .where(and(...filters))
            )[0];

            return {
                items,
                count: _count,
                filteredCount,
            };
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const items = await db
                .select(projection)
                .from(transactions)
                .leftJoin(projects, eq(projects.id, transactions.projectId))
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

    consolidate: protectedProcedure
        .input(
            consolidationSchema.safeExtend({
                id: z.uuid(),
            })
        )
        .mutation(async ({ input }) => {
            const { id, ...values } = input;
            return await db
                .update(transactions)
                .set(values)
                .where(eq(transactions.id, id))
                .returning();
        }),

    statistics: protectedProcedure.query(async () => {
        const statistics = await db
            .select({
                pendingConsolidationCount: count(),
            })
            .from(transactions)
            .where(isNull(transactions.consolidationGroup));

        return statistics[0];
    }),
});
