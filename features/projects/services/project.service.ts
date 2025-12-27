import {
    and,
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

export class ProjectService {
    async list(input: z.infer<typeof listProjectSchema>) {
        const { pagination, sorting, filters: filterInput } = input;

        const whereFilters: SQL[] = [];
        const havingFilters: SQL[] = [];

        if (filterInput) {
            if (filterInput.keyword) {
                whereFilters.push(
                    or(
                        ilike(projects.client, "%" + filterInput.keyword + "%"),
                        ilike(projects.title, "%" + filterInput.keyword + "%")
                    )!
                );
            }

            if (filterInput.status) {
                switch (filterInput.status) {
                    case "planning":
                        whereFilters.push(isNull(projects.startDate));
                        break;
                    case "inProgress":
                        whereFilters.push(
                            and(
                                isNotNull(projects.startDate),
                                isNull(projects.endDate)
                            )!
                        );
                        break;
                    case "awaitingPayment":
                        whereFilters.push(
                            and(
                                isNotNull(projects.startDate),
                                isNotNull(projects.endDate)
                            )!
                        );
                        havingFilters.push(
                            sql`SUM(COALESCE(${paymentsSq.total}, 0)) < ${projects.price}`
                        );
                        break;
                    case "completed":
                        whereFilters.push(
                            and(
                                isNotNull(projects.startDate),
                                isNotNull(projects.endDate)
                            )!
                        );
                        havingFilters.push(
                            sql`SUM(COALESCE(${paymentsSq.total}, 0)) >= ${projects.price}`
                        );
                        break;
                }
            }

            if (filterInput.from) {
                whereFilters.push(gte(projects.startDate, filterInput.from));
            }

            if (filterInput.to) {
                whereFilters.push(lte(projects.startDate, filterInput.to));
            }
        }

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

        const query = db
            .select(projection)
            .from(projects)
            .leftJoin(paymentsSq, eq(paymentsSq.projectId, projects.id))
            .leftJoin(suppliesSq, eq(suppliesSq.projectId, projects.id))
            .leftJoin(laborsSq, eq(laborsSq.projectId, projects.id))
            .leftJoin(miscSq, eq(miscSq.projectId, projects.id))
            .where(and(...whereFilters))
            .groupBy(projects.id)
            .having(and(...havingFilters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        return {
            items,
            count: 0, // TODO: fix this
            filteredCount: 0, // TODO: fix this
        };
    }

    async get(id: string) {
        const items = await db
            .select(projection)
            .from(projects)
            .leftJoin(paymentsSq, eq(paymentsSq.projectId, projects.id))
            .leftJoin(suppliesSq, eq(suppliesSq.projectId, projects.id))
            .leftJoin(laborsSq, eq(laborsSq.projectId, projects.id))
            .leftJoin(miscSq, eq(miscSq.projectId, projects.id))
            .groupBy(projects.id)
            .where(eq(projects.id, id))
            .limit(1);

        return items[0] ?? null;
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
