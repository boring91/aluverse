import {
    asc,
    count,
    desc,
    eq,
    SQL,
    sql,
    sum,
    gte,
    lte,
    ilike,
    or,
    isNull,
    isNotNull,
    and,
} from "drizzle-orm";
import {
    db,
    projectLabors,
    projectMisc,
    projectPayments,
    projects,
    projectSupplies,
} from "@/db";
import { listProjectSchema } from "../schemas/project.schema";
import { z } from "zod";
import { defineQuery, leftJoin } from "@/lib/server-utils";

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

const projectsQuery = defineQuery({
    from: projects,
    key: "id",
    projection: {
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
    },
    joins: [
        leftJoin(paymentsSq, eq(paymentsSq.projectId, projects.id)),
        leftJoin(suppliesSq, eq(suppliesSq.projectId, projects.id)),
        leftJoin(laborsSq, eq(laborsSq.projectId, projects.id)),
        leftJoin(miscSq, eq(miscSq.projectId, projects.id)),
    ],
    groupBy: [projects.id],
});

export class ProjectService {
    private buildFilters(
        filterInput?: z.infer<typeof listProjectSchema>["filters"]
    ) {
        const where: SQL[] = [];
        const having: SQL[] = [];

        if (!filterInput) {
            return { where, having };
        }

        if (filterInput.keyword) {
            where.push(
                or(
                    ilike(projects.client, "%" + filterInput.keyword + "%"),
                    ilike(projects.title, "%" + filterInput.keyword + "%")
                )!
            );
        }

        if (filterInput.status) {
            switch (filterInput.status) {
                case "planning":
                    where.push(isNull(projects.startDate));
                    break;
                case "inProgress":
                    where.push(
                        and(
                            isNotNull(projects.startDate),
                            isNull(projects.endDate)
                        )!
                    );
                    break;
                case "awaitingPayment":
                    where.push(
                        and(
                            isNotNull(projects.startDate),
                            isNotNull(projects.endDate)
                        )!
                    );
                    having.push(
                        sql`SUM(COALESCE(${paymentsSq.total}, 0)) < ${projects.price}`
                    );
                    break;
                case "completed":
                    where.push(
                        and(
                            isNotNull(projects.startDate),
                            isNotNull(projects.endDate)
                        )!
                    );
                    having.push(
                        sql`SUM(COALESCE(${paymentsSq.total}, 0)) >= ${projects.price}`
                    );
                    break;
            }
        }

        if (filterInput.from) {
            where.push(gte(projects.startDate, filterInput.from));
        }

        if (filterInput.to) {
            where.push(lte(projects.startDate, filterInput.to));
        }

        return { where, having };
    }

    private buildOrderBy(
        sorting?: z.infer<typeof listProjectSchema>["sorting"]
    ) {
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

        return orderBy;
    }

    async list(input: z.infer<typeof listProjectSchema>) {
        const { pagination, sorting, filters } = input;
        const { where, having } = this.buildFilters(filters);
        const orderBy = this.buildOrderBy(sorting);

        return await projectsQuery.list({
            where,
            having,
            orderBy,
            pagination,
        });
    }

    async get(id: string) {
        return await projectsQuery.get({
            where: [eq(projects.id, id)],
        });
    }

    async create(data: {
        client: string;
        title: string;
        visitDate?: Date | null;
        startDate?: Date | null;
        endDate?: Date | null;
        address?: string | null;
        meters?: number | null;
        price: number; // in cents
    }) {
        // Compute a new human id in this format PXXXX:
        const { _count } = (
            await db.select({ _count: count() }).from(projects)
        )[0];
        const humanId = "P" + `${_count + 1}`.padStart(4, "0");

        return await db
            .insert(projects)
            .values({
                ...data,
                humanId,
            })
            .returning();
    }

    async update(data: {
        id: string;
        client: string;
        title: string;
        visitDate?: Date | null;
        startDate?: Date | null;
        endDate?: Date | null;
        address?: string | null;
        meters?: number | null;
        price: number; // in cents
    }) {
        return await db
            .update(projects)
            .set(data)
            .where(eq(projects.id, data.id))
            .returning();
    }

    async delete(id: string) {
        return await db.delete(projects).where(eq(projects.id, id)).returning();
    }
}
