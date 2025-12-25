import {
    db,
    projectSupplies,
    projectLabors,
    projectMisc,
    projectPayments,
} from "@/db";
import { SQL, ilike, desc, asc, and, count, eq } from "drizzle-orm";
import { z } from "zod";
import {
    createProjectLaborSchemaWithProjectId,
    createProjectMiscSchemaWithProjectId,
    createProjectPaymentSchemaWithProjectId,
    createProjectSupplySchemaWithProjectId,
    listProjectItemSchema,
} from "../schemas/project-item.schema";

// Supplies
const supplyProjection = {
    id: projectSupplies.id,
    name: projectSupplies.name,
    quantity: projectSupplies.quantity,
    unitPrice: projectSupplies.unitPrice,
} as const;

// Labors
const laborProjection = {
    id: projectLabors.id,
    name: projectLabors.name,
    hours: projectLabors.hours,
    rate: projectLabors.rate,
} as const;

// Misc
const miscProjection = {
    id: projectMisc.id,
    name: projectMisc.name,
    amount: projectMisc.amount,
} as const;

// Payments
const paymentProjection = {
    id: projectPayments.id,
    date: projectPayments.date,
    amount: projectPayments.amount,
} as const;

export class ProjectItemService {
    // Supplies
    async listSupplies(input: z.infer<typeof listProjectItemSchema>) {
        const { projectId, pagination, columnFilters, sorting } = input;

        const filters: SQL[] = [eq(projectSupplies.projectId, projectId)];

        columnFilters?.forEach(filter => {
            if (filter.id === "name" && typeof filter.value === "string") {
                filters.push(ilike(projectSupplies.name, `%${filter.value}%`));
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
            .select(supplyProjection)
            .from(projectSupplies)
            .where(and(...filters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        const { filteredCount } = (
            await db.select({ filteredCount: count() }).from(projectSupplies)
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
    }

    async getSupply(id: string) {
        const items = await db
            .select(supplyProjection)
            .from(projectSupplies)
            .where(eq(projectSupplies.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async createSupply(
        data: z.infer<typeof createProjectSupplySchemaWithProjectId>
    ) {
        return await db.insert(projectSupplies).values(data).returning();
    }

    async updateSupply(data: {
        id: string;
        name: string;
        quantity: number;
        unitPrice: number; // in cents
    }) {
        return await db
            .update(projectSupplies)
            .set(data)
            .where(eq(projectSupplies.id, data.id))
            .returning();
    }

    async deleteSupply(id: string) {
        return await db
            .delete(projectSupplies)
            .where(eq(projectSupplies.id, id))
            .returning();
    }

    // Labors
    async listLabors(input: z.infer<typeof listProjectItemSchema>) {
        const { projectId, pagination, columnFilters, sorting } = input;

        const filters: SQL[] = [eq(projectLabors.projectId, projectId)];

        columnFilters?.forEach(filter => {
            if (filter.id === "name" && typeof filter.value === "string") {
                filters.push(ilike(projectLabors.name, `%${filter.value}%`));
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
            .select(laborProjection)
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
    }

    async getLabor(id: string) {
        const items = await db
            .select(laborProjection)
            .from(projectLabors)
            .where(eq(projectLabors.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async createLabor(
        data: z.infer<typeof createProjectLaborSchemaWithProjectId>
    ) {
        return await db.insert(projectLabors).values(data).returning();
    }

    async updateLabor(data: {
        id: string;
        name: string;
        hours: number;
        rate: number; // in cents per hour
    }) {
        return await db
            .update(projectLabors)
            .set(data)
            .where(eq(projectLabors.id, data.id))
            .returning();
    }

    async deleteLabor(id: string) {
        return await db
            .delete(projectLabors)
            .where(eq(projectLabors.id, id))
            .returning();
    }

    // Misc
    async listMisc(input: z.infer<typeof listProjectItemSchema>) {
        const { projectId, pagination, columnFilters, sorting } = input;

        const filters: SQL[] = [eq(projectMisc.projectId, projectId)];

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
        const query = db
            .select(miscProjection)
            .from(projectMisc)
            .where(and(...filters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

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
    }

    async getMisc(id: string) {
        const items = await db
            .select(miscProjection)
            .from(projectMisc)
            .where(eq(projectMisc.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async createMisc(
        data: z.infer<typeof createProjectMiscSchemaWithProjectId>
    ) {
        return await db.insert(projectMisc).values(data).returning();
    }

    async updateMisc(data: {
        id: string;
        name: string;
        amount: number; // in cents
    }) {
        return await db
            .update(projectMisc)
            .set(data)
            .where(eq(projectMisc.id, data.id))
            .returning();
    }

    async deleteMisc(id: string) {
        return await db
            .delete(projectMisc)
            .where(eq(projectMisc.id, id))
            .returning();
    }

    // Payments
    async listPayments(input: z.infer<typeof listProjectItemSchema>) {
        const { projectId, pagination, columnFilters, sorting } = input;

        const filters: SQL[] = [eq(projectPayments.projectId, projectId)];

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
            .select(paymentProjection)
            .from(projectPayments)
            .where(and(...filters))
            .orderBy(...orderBy);

        const items = await (pageSize === -1
            ? query
            : query.offset(pageIndex * pageSize).limit(pageSize));

        const { filteredCount } = (
            await db.select({ filteredCount: count() }).from(projectPayments)
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
    }

    async getPayment(id: string) {
        const items = await db
            .select(paymentProjection)
            .from(projectPayments)
            .where(eq(projectPayments.id, id))
            .limit(1);

        return items[0] ?? null;
    }

    async createPayment(
        data: z.infer<typeof createProjectPaymentSchemaWithProjectId>
    ) {
        return await db.insert(projectPayments).values(data).returning();
    }

    async updatePayment(data: {
        id: string;
        date: Date;
        amount: number; // in cents
    }) {
        return await db
            .update(projectPayments)
            .set(data)
            .where(eq(projectPayments.id, data.id))
            .returning();
    }

    async deletePayment(id: string) {
        return await db
            .delete(projectPayments)
            .where(eq(projectPayments.id, id))
            .returning();
    }
}
