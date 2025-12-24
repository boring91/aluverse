import { projectSupplies, db } from "@/db";
import { listSchema } from "@/lib/util-schemas";
import { SQL, ilike, desc, asc, and, count, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { createProjectSupplySchema } from "@/lib/trpc-schemas";
import { z } from "zod";

const projection = {
    id: projectSupplies.id,
    name: projectSupplies.name,
    quantity: projectSupplies.quantity,
    unitPrice: projectSupplies.unitPrice,
} as const;

export const projectSuppliesRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                projectId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { pagination, columnFilters, sorting } = input;

            const filters: SQL[] = [
                eq(projectSupplies.projectId, input.projectId),
            ];

            columnFilters?.forEach(filter => {
                if (filter.id === "name" && typeof filter.value === "string") {
                    filters.push(
                        ilike(projectSupplies.name, `%${filter.value}%`)
                    );
                }
            });

            const orderBy: SQL[] = [];
            sorting?.forEach(sort => {
                const direction = sort.desc ? desc : asc;
                switch (sort.id) {
                    case "name":
                        orderBy.push(direction(projectSupplies.name));
                        break;
                    case "quantity":
                        orderBy.push(direction(projectSupplies.quantity));
                        break;
                    case "unitPrice":
                        orderBy.push(direction(projectSupplies.unitPrice));
                        break;
                }
            });

            const { pageIndex, pageSize } = pagination;
            const query = db
                .select(projection)
                .from(projectSupplies)
                .where(and(...filters))
                .orderBy(...orderBy);

            const items = await (pageSize === -1
                ? query
                : query.offset(pageIndex * pageSize).limit(pageSize));

            const { filteredCount } = (
                await db
                    .select({ filteredCount: count() })
                    .from(projectSupplies)
            )[0];

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(projectSupplies)
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
                .from(projectSupplies)
                .where(eq(projectSupplies.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createProjectSupplySchema
                .extend({
                    projectId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    unitPrice: v.unitPrice * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(projectSupplies).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createProjectSupplySchema
                .extend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    unitPrice: v.unitPrice * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(projectSupplies)
                .set(input)
                .where(eq(projectSupplies.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(projectSupplies)
                .where(eq(projectSupplies.id, input.id))
                .returning();
        }),
});
