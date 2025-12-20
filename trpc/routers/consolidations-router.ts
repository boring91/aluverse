import { listSchema } from "@/lib/util-schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import {
    and,
    asc,
    count,
    desc,
    eq,
    ilike,
    isNull,
    sql,
} from "drizzle-orm";
import { consolidations, db, projects, transactions } from "@/db";
import { z } from "zod";
import { createConsolidationSchema } from "@/lib/trpc-schemas";
import { createProjectedQuery, one, oneRequired } from "@/lib/server-utils";

const projection = {
    key: "id",
    fields: {
        id: consolidations.id,
        amount: consolidations.amount,
        isGst: consolidations.isGst,
        consolidationGroup: consolidations.consolidationGroup,
        budgetCategory: consolidations.budgetCategory,
        project: one({
            key: "id",
            fields: {
                id: projects.id,
                humanId: projects.humanId,
                title: projects.title,
            },
        }),
        transaction: oneRequired({
            key: "id",
            fields: {
                id: transactions.id,
                date: transactions.date,
                description: transactions.description,
                amount: transactions.amount,
                type: transactions.type,
            },
        }),
    },
} as const;

export const consolidationsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.safeExtend({
                transactionId: z.uuid(),
            })
        )
        .query(async ({ input }) => {
            const { pagination, columnFilters, sorting } = input;

            const baseFilters = [
                eq(consolidations.transactionId, input.transactionId),
            ];
            const filters = [...baseFilters];

            if (columnFilters?.length) {
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
                            orderBy.push(direction(consolidations.amount));
                            break;
                        default:
                            orderBy.push(desc(transactions.date));
                    }
                });
            } else {
                orderBy.push(desc(transactions.date));
            }

            const { pageIndex, pageSize } = pagination;
            const { selection, transform } = createProjectedQuery(projection);

            const items = await db
                .select(selection)
                .from(consolidations)
                .innerJoin(
                    transactions,
                    eq(consolidations.transactionId, transactions.id)
                )
                .leftJoin(projects, eq(consolidations.projectId, projects.id))
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(consolidations)
                    .where(and(...baseFilters))
            )[0];

            const { filteredCount } = (
                await db
                    .select({ filteredCount: count() })
                    .from(consolidations)
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
            const { selection, transform } = createProjectedQuery(projection);

            const items = await db
                .select(selection)
                .from(consolidations)
                .innerJoin(
                    transactions,
                    eq(consolidations.transactionId, transactions.id)
                )
                .leftJoin(projects, eq(consolidations.projectId, projects.id))
                .where(eq(consolidations.id, input.id))
                .limit(1);

            return transform(items)[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createConsolidationSchema
                .safeExtend({
                    transactionId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(consolidations).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createConsolidationSchema
                .safeExtend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(consolidations)
                .set(input)
                .where(eq(consolidations.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(consolidations)
                .where(eq(consolidations.id, input.id))
                .returning();
        }),

    getDefault: protectedProcedure
        .input(z.object({ transactionId: z.uuid() }))
        .query(async ({ input }) => {
            const { transactionId } = input;

            return (
                await db
                    .select({
                        description: transactions.description,
                        remainingAmount: sql<number>`${transactions.amount} - COALESCE(SUM(${consolidations.amount}), 0)`,
                    })
                    .from(transactions)
                    .leftJoin(
                        consolidations,
                        eq(transactions.id, consolidations.transactionId)
                    )
                    .where(eq(transactions.id, transactionId))
                    .groupBy(transactions.id)
            )[0];
        }),

    statistics: protectedProcedure.query(async () => {
        const statistics = await db
            .select({
                pendingConsolidationCount: count(),
            })
            .from(consolidations)
            .where(isNull(consolidations.consolidationGroup));

        return statistics[0];
    }),
});
