import { listSchema } from "@/lib/util-schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import { consolidations, db, projects, transactions } from "@/db";
import { z } from "zod";
import { consolidationSchema } from "@/lib/trpc-schemas";

const projection = {
    id: consolidations.id,
    amount: consolidations.amount,
    isGst: consolidations.isGst,
    consolidationGroup: consolidations.consolidationGroup,
    budgetCategory: consolidations.budgetCategory,
    project: {
        id: projects.id,
        title: projects.title,
        humanId: projects.humanId,
    },
    transaction: {
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
    },
};

export const consolidationsRouter = createTRPCRouter({
    list: protectedProcedure.input(listSchema).query(async ({ input }) => {
        const { pagination, columnFilters, sorting } = input;

        const filters = [];

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
        const items = await db
            .select(projection)
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
            await db.select({ _count: count() }).from(consolidations)
        )[0];

        const { filteredCount } = (
            await db
                .select({ filteredCount: count() })
                .from(consolidations)
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
                .from(consolidations)
                .innerJoin(
                    transactions,
                    eq(consolidations.transactionId, transactions.id)
                )
                .leftJoin(projects, eq(consolidations.projectId, projects.id))
                .where(eq(consolidations.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    update: protectedProcedure
        .input(
            consolidationSchema.safeExtend({
                id: z.uuid(),
            })
        )
        .mutation(async ({ input }) => {
            return await db
                .update(consolidations)
                .set(input)
                .where(eq(consolidations.id, input.id))
                .returning();
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
