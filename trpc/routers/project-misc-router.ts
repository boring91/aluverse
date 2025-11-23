import { projectMisc, db } from "@/db";
import { listSchema } from "@/lib/util-schemas";
import { SQL, ilike, desc, asc, and, count, eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { createProjectMiscSchema } from "@/lib/trpc-schemas";
import { z } from "zod";

const projection = {
    id: projectMisc.id,
    name: projectMisc.name,
    amount: projectMisc.amount,
} as const;

export const projectMiscRouter = createTRPCRouter({
    list: protectedProcedure
        .input(
            listSchema.extend({
                projectId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const { pagination, columnFilters, sorting } = input;

            const filters: SQL[] = [eq(projectMisc.projectId, input.projectId)];

            columnFilters?.forEach(filter => {
                if (filter.id === "name" && typeof filter.value === "string") {
                    filters.push(ilike(projectMisc.name, `%${filter.value}%`));
                }
            });

            const orderBy: SQL[] = [];
            sorting?.forEach(sort => {
                const direction = sort.desc ? desc : asc;
                switch (sort.id) {
                    case "name":
                        orderBy.push(direction(projectMisc.name));
                        break;
                    case "amount":
                        orderBy.push(direction(projectMisc.amount));
                        break;
                }
            });

            const { pageIndex, pageSize } = pagination;
            const items = await db
                .select(projection)
                .from(projectMisc)
                .where(and(...filters))
                .orderBy(...orderBy)
                .offset(pageIndex * pageSize)
                .limit(pageSize);

            const { filteredCount } = (
                await db.select({ filteredCount: count() }).from(projectMisc)
            )[0];

            const { _count } = (
                await db
                    .select({ _count: count() })
                    .from(projectMisc)
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
                .from(projectMisc)
                .where(eq(projectMisc.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createProjectMiscSchema
                .extend({
                    projectId: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    amount: v.amount * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db.insert(projectMisc).values(input).returning();
        }),

    update: protectedProcedure
        .input(
            createProjectMiscSchema
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
                .update(projectMisc)
                .set(input)
                .where(eq(projectMisc.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(projectMisc)
                .where(eq(projectMisc.id, input.id))
                .returning();
        }),
});
