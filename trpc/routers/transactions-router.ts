import { consolidations, db, projects, transactions } from "@/db";
import { createTRPCRouter, protectedProcedure } from "../init";
import { z } from "zod";
import { count, desc, asc, eq, ilike, and, sum } from "drizzle-orm";
import { createTransactionSchema } from "@/lib/trpc-schemas";
import { listSchema } from "@/lib/util-schemas";
import { createProjectedQuery, many, one } from "@/lib/server-utils";

const consolidationsSq = db
    .select({
        transactionId: consolidations.transactionId,
        total: sum(consolidations.amount)
            .mapWith(Number)
            .as("consolidatedTotal"),
    })
    .from(consolidations)
    .groupBy(consolidations.transactionId)
    .as("consolidationsSq");

const transactionProjection = {
    key: "id",
    fields: {
        id: transactions.id,
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        consolidatedAmount: consolidationsSq.total,
        consolidations: many({
            key: "id",
            fields: {
                id: consolidations.id,
                consolidationGroup: consolidations.consolidationGroup,
                description: consolidations.description,
                isGst: consolidations.isGst,
                budgetCategory: consolidations.budgetCategory,
                project: one({
                    key: "id",
                    fields: {
                        id: projects.id,
                        humanId: projects.humanId,
                        title: projects.title,
                    },
                }),
            },
        }),
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
                            orderBy.push(desc(transactions.date));
                    }
                });
            } else {
                orderBy.push(desc(transactions.date));
            }

            const { pageIndex, pageSize } = pagination;

            const { selection, transform } = createProjectedQuery(
                transactionProjection
            );

            const items = await db
                .select(selection)
                .from(transactions)
                .leftJoin(
                    consolidationsSq,
                    eq(transactions.id, consolidationsSq.transactionId)
                )
                .leftJoin(
                    consolidations,
                    eq(transactions.id, consolidations.transactionId)
                )
                .leftJoin(projects, eq(consolidations.projectId, projects.id))
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { _count } = (
                await db.select({ _count: count() }).from(transactions)
            )[0];

            const { filteredCount } = (
                await db
                    .select({ filteredCount: count() })
                    .from(transactions)
                    .where(and(...filters))
            )[0];

            return {
                items: transform(items),
                count: _count,
                filteredCount,
            };
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const { selection, transform } = createProjectedQuery(
                transactionProjection
            );
            const items = await db
                .select(selection)
                .from(transactions)
                .leftJoin(
                    consolidationsSq,
                    eq(transactions.id, consolidationsSq.transactionId)
                )
                .leftJoin(
                    consolidations,
                    eq(transactions.id, consolidations.transactionId)
                )
                .leftJoin(projects, eq(consolidations.projectId, projects.id))
                .where(eq(transactions.id, input.id))
                .limit(1);

            const result = transform(items);

            return result[0] ?? null;
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
            const transaction = (
                await db.insert(transactions).values(input).returning()
            )[0];

            return transaction;
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
            const transaction = (
                await db
                    .update(transactions)
                    .set(input)
                    .where(eq(transactions.id, input.id))
                    .returning()
            )[0];

            return transaction;
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
