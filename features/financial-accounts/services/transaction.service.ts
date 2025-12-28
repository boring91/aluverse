import { db, transactions, consolidations, projects } from "@/db";
import {
    desc,
    asc,
    eq,
    gte,
    lte,
    ne,
    or,
    isNull,
    SQL,
    ilike,
    sql,
    sum,
} from "drizzle-orm";
import { defineQuery, leftJoin, many, one } from "@/lib/server-utils";
import { z } from "zod";
import {
    createTransactionWithAccountIdSchema,
    listTransactionSchema,
    updateTransactionSchema,
} from "../schemas/transaction.schema";

const consolidationsSq = db
    .select({
        transactionId: consolidations.transactionId,
        total: sum(consolidations.amount)
            .mapWith(Number)
            .as("consolidatedTotal"),
    })
    .from(consolidations)
    .groupBy(consolidations.transactionId)
    .as("consolidationsSq");

const transactionsQuery = defineQuery({
    from: transactions,
    key: "id",
    projection: {
        id: transactions.id,
        date: transactions.date,
        amount: transactions.amount,
        type: transactions.type,
        description: transactions.description,
        consolidatedAmount: consolidationsSq.total,
        consolidations: many({
            key: "id",
            fields: {
                id: consolidations.id,
                consolidationGroup: consolidations.consolidationGroup,
                description: consolidations.description,
                isGst: consolidations.isGst,
                budgetCategory: consolidations.budgetCategory,
                project: one({
                    key: "id",
                    fields: {
                        id: projects.id,
                        humanId: projects.humanId,
                        title: projects.title,
                    },
                }),
            },
        }),
    },
    joins: [
        leftJoin(
            consolidationsSq,
            eq(transactions.id, consolidationsSq.transactionId)
        ),
        leftJoin(
            consolidations,
            eq(transactions.id, consolidations.transactionId)
        ),
        leftJoin(projects, eq(consolidations.projectId, projects.id)),
    ],
});

export class TransactionService {
    private buildFilters(
        accountId?: string,
        filters?: z.infer<typeof listTransactionSchema>["filters"]
    ) {
        const baseWhere: SQL[] = accountId
            ? [eq(transactions.accountId, accountId)]
            : [];

        const where: SQL[] = [];

        if (filters) {
            if (filters.keyword) {
                where.push(
                    ilike(transactions.description, "%" + filters.keyword + "%")
                );
            }

            if (filters.from) {
                where.push(gte(transactions.date, filters.from));
            }

            if (filters.to) {
                where.push(lte(transactions.date, filters.to));
            }

            if (
                filters.isConsolidated !== undefined &&
                filters.isConsolidated
            ) {
                where.push(eq(transactions.amount, consolidationsSq.total));
            }

            if (
                filters.isConsolidated !== undefined &&
                !filters.isConsolidated
            ) {
                where.push(
                    or(
                        ne(transactions.amount, consolidationsSq.total),
                        isNull(consolidationsSq.total)
                    )!
                );
            }
        }

        return { baseWhere, where, having: [] };
    }

    private buildOrderBy(
        sorting?: z.infer<typeof listTransactionSchema>["sorting"]
    ) {
        const orderBy: SQL[] = [];

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
                        orderBy.push(
                            direction(
                                sql`CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE -1 * ${transactions.amount} END`
                            )
                        );
                        break;
                    default:
                        orderBy.push(desc(transactions.date));
                }
            });
        } else {
            orderBy.push(desc(transactions.date));
        }

        return orderBy;
    }

    async list(input: z.infer<typeof listTransactionSchema>) {
        const { accountId, pagination, sorting, filters } = input;
        const { baseWhere, where, having } = this.buildFilters(
            accountId,
            filters
        );
        const orderBy = this.buildOrderBy(sorting);

        return await transactionsQuery.list({
            baseWhere,
            where,
            having,
            orderBy,
            pagination,
        });
    }

    async get(id: string) {
        return await transactionsQuery.get({
            where: [eq(transactions.id, id)],
        });
    }

    async create(data: z.infer<typeof createTransactionWithAccountIdSchema>) {
        const transaction = (
            await db.insert(transactions).values(data).returning()
        )[0];

        return transaction;
    }

    async update(data: z.infer<typeof updateTransactionSchema>) {
        const transaction = (
            await db
                .update(transactions)
                .set({
                    date: data.date,
                    description: data.description,
                    amount: data.amount,
                    type: data.type,
                })
                .where(eq(transactions.id, data.id))
                .returning()
        )[0];

        return transaction;
    }

    async delete(id: string) {
        return await db
            .delete(transactions)
            .where(eq(transactions.id, id))
            .returning();
    }
}
