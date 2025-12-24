import { projectPayments, db } from "@/db";
import { listSchema } from "@/lib/util-schemas";
import { SQL, desc, asc, and, count, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { createProjectPaymentSchema } from "@/lib/trpc-schemas";
import { z } from "zod";

const projection = {
    id: projectPayments.id,
    date: projectPayments.date,
    amount: projectPayments.amount,
} as const;

export const projectPaymentsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                projectId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { pagination, columnFilters, sorting } = input;

            const filters: SQL[] = [
                eq(projectPayments.projectId, input.projectId),
            ];

            columnFilters?.forEach(() => {});

            const orderBy: SQL[] = [];
            sorting?.forEach(sort => {
                const direction = sort.desc ? desc : asc;
                switch (sort.id) {
                    case "date":
                        orderBy.push(direction(projectPayments.date));
                        break;
                    case "amount":
                        orderBy.push(direction(projectPayments.amount));
                        break;
                }
            });

            const { pageIndex, pageSize } = pagination;
            const query = db
                .select(projection)
                .from(projectPayments)
                .where(and(...filters))
                .orderBy(...orderBy);

            const items = await (pageSize === -1
                ? query
                : query.offset(pageIndex * pageSize).limit(pageSize));

            const { filteredCount } = (
                await db
                    .select({ filteredCount: count() })
                    .from(projectPayments)
            )[0];

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(projectPayments)
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
                .from(projectPayments)
                .where(eq(projectPayments.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createProjectPaymentSchema
                .extend({
                    projectId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(projectPayments).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createProjectPaymentSchema
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
                .update(projectPayments)
                .set(input)
                .where(eq(projectPayments.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(projectPayments)
                .where(eq(projectPayments.id, input.id))
                .returning();
        }),
});
