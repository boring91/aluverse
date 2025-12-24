import { projectLabors, db } from "@/db";
import { listSchema } from "@/lib/util-schemas";
import { SQL, ilike, desc, asc, and, count, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { createProjectLaborSchema } from "@/lib/trpc-schemas";
import { z } from "zod";

const projection = {
    id: projectLabors.id,
    name: projectLabors.name,
    hours: projectLabors.hours,
    rate: projectLabors.rate,
} as const;

export const projectLaborsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                projectId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { pagination, columnFilters, sorting } = input;

            const filters: SQL[] = [
                eq(projectLabors.projectId, input.projectId),
            ];

            columnFilters?.forEach(filter => {
                if (filter.id === "name" && typeof filter.value === "string") {
                    filters.push(
                        ilike(projectLabors.name, `%${filter.value}%`)
                    );
                }
            });

            const orderBy: SQL[] = [];
            sorting?.forEach(sort => {
                const direction = sort.desc ? desc : asc;
                switch (sort.id) {
                    case "name":
                        orderBy.push(direction(projectLabors.name));
                        break;
                    case "hours":
                        orderBy.push(direction(projectLabors.hours));
                        break;
                    case "rate":
                        orderBy.push(direction(projectLabors.rate));
                        break;
                }
            });

            const { pageIndex, pageSize } = pagination;
            const query = db
                .select(projection)
                .from(projectLabors)
                .where(and(...filters))
                .orderBy(...orderBy);

            const items = await (pageSize === -1
                ? query
                : query.offset(pageIndex * pageSize).limit(pageSize));

            const { filteredCount } = (
                await db.select({ filteredCount: count() }).from(projectLabors)
            )[0];

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(projectLabors)
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
                .from(projectLabors)
                .where(eq(projectLabors.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createProjectLaborSchema
                .extend({
                    projectId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    rate: v.rate * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(projectLabors).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createProjectLaborSchema
                .extend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    rate: v.rate * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(projectLabors)
                .set(input)
                .where(eq(projectLabors.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(projectLabors)
                .where(eq(projectLabors.id, input.id))
                .returning();
        }),
});
