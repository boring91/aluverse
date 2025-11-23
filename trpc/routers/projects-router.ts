import { and, asc, count, desc, eq, ilike, SQL, sql, sum } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { listSchema } from "@/lib/util-schemas";
import {
    db,
    projectLabors,
    projectMisc,
    projectPayments,
    projects,
    projectSupplies,
} from "@/db";
import { z } from "zod";
import { createProjectSchema } from "@/lib/trpc-schemas";

const paymentsSq = db
    .select({
        projectId: projectPayments.projectId,
        total: sum(projectPayments.amount).as("paymentTotal"),
    })
    .from(projectPayments)
    .groupBy(projectPayments.projectId)
    .as("paymentsSq");

const suppliesSq = db
    .select({
        projectId: projectSupplies.projectId,
        total: sql<number>`SUM(${projectSupplies.unitPrice} * ${projectSupplies.quantity})`.as(
            "supplyTotal"
        ),
    })
    .from(projectSupplies)
    .groupBy(projectSupplies.projectId)
    .as("suppliesSq");

const laborsSq = db
    .select({
        projectId: projectLabors.projectId,
        total: sql<number>`SUM(${projectLabors.rate} * ${projectLabors.hours})`.as(
            "laborTotal"
        ),
    })
    .from(projectLabors)
    .groupBy(projectLabors.projectId)
    .as("laborsSq");

const miscSq = db
    .select({
        projectId: projectMisc.projectId,
        total: sum(projectMisc.amount).as("miscTotal"),
    })
    .from(projectMisc)
    .groupBy(projectMisc.projectId)
    .as("miscSq");

const projection = {
    id: projects.id,
    humanId: projects.humanId,
    client: projects.client,
    title: projects.title,
    visitDate: projects.visitDate,
    startDate: projects.startDate,
    endDate: projects.endDate,
    address: projects.address,
    meters: projects.meters,
    price: projects.price,
    paid: sql<number>`SUM(COALESCE(${paymentsSq.total}, 0))`,
    cost: sql<number>`SUM(COALESCE(${suppliesSq.total}, 0)) + SUM(COALESCE(${laborsSq.total}, 0)) + SUM(COALESCE(${miscSq.total}, 0))`,
} as const;

export const projectsRouter = createTRPCRouter({
    list: protectedProcedure.input(listSchema).query(async ({ input }) => {
        const { pagination, columnFilters, sorting } = input;

        const filters: SQL[] = [];

        columnFilters?.forEach(filter => {
            if (filter.id === "title" && typeof filter.value === "string") {
                filters.push(ilike(projects.title, `%${filter.value}%`));
            }

            if (filter.id === "humanId" && typeof filter.value === "string") {
                filters.push(ilike(projects.humanId, `%${filter.value}%`));
            }
        });

        const orderBy: SQL[] = [];
        sorting?.forEach(sort => {
            const direction = sort.desc ? desc : asc;
            switch (sort.id) {
                case "humanId":
                    orderBy.push(direction(projects.humanId));
                    break;
                case "price":
                    orderBy.push(direction(projects.price));
                    break;
                case "visitDate":
                    orderBy.push(direction(projects.visitDate));
                    break;
                case "startDate":
                    orderBy.push(direction(projects.startDate));
                    break;
                case "endDate":
                    orderBy.push(direction(projects.endDate));
                    break;
            }
        });

        const { pageIndex, pageSize } = pagination;

        const items = await db
            .select(projection)
            .from(projects)
            .leftJoin(paymentsSq, eq(paymentsSq.projectId, projects.id))
            .leftJoin(suppliesSq, eq(suppliesSq.projectId, projects.id))
            .leftJoin(laborsSq, eq(laborsSq.projectId, projects.id))
            .leftJoin(miscSq, eq(miscSq.projectId, projects.id))
            .groupBy(projects.id)
            .orderBy(...orderBy)
            .offset(pageIndex * pageSize)
            .limit(pageSize);

        const { filteredCount } = (
            await db.select({ filteredCount: count() }).from(projects)
        )[0];

        const { _count } = (
            await db
                .select({ _count: count() })
                .from(projects)
                .where(and(...filters))
        )[0];

        return {
            items,
            count: _count,
            filteredCount,
        };
    }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const items = await db
                .select(projection)
                .from(projects)
                .leftJoin(paymentsSq, eq(paymentsSq.projectId, projects.id))
                .leftJoin(suppliesSq, eq(suppliesSq.projectId, projects.id))
                .leftJoin(laborsSq, eq(laborsSq.projectId, projects.id))
                .leftJoin(miscSq, eq(miscSq.projectId, projects.id))
                .groupBy(projects.id)
                .where(eq(projects.id, input.id))
                .limit(1);

            return items[0] ?? null;
        }),

    create: protectedProcedure
        .input(
            createProjectSchema.transform(v => ({
                ...v,
                price: v.price * 100,
            }))
        )
        .mutation(async ({ input }) => {
            // Compute a new human id in this format PXXXX:
            const { _count } = (
                await db.select({ _count: count() }).from(projects)
            )[0];
            const humanId = "P" + `${_count + 1}`.padStart(4, "0");

            return await db
                .insert(projects)
                .values({
                    ...input,
                    humanId,
                })
                .returning();
        }),

    update: protectedProcedure
        .input(
            createProjectSchema
                .extend({
                    id: z.uuid(),
                })
                .transform(v => ({
                    ...v,
                    price: v.price * 100,
                }))
        )
        .mutation(async ({ input }) => {
            return await db
                .update(projects)
                .set(input)
                .where(eq(projects.id, input.id))
                .returning();
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await db
                .delete(projects)
                .where(eq(projects.id, input.id))
                .returning();
        }),
});
