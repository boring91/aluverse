import { db, transactions, consolidations, projects } from "@/db";
import {
    count,
    desc,
    asc,
    eq,
    and,
    sum,
    gte,
    lte,
    ne,
    or,
    isNull,
    SQL,
    ilike,
    sql,
} from "drizzle-orm";
import { createProjectedQuery, many, one } from "@/lib/server-utils";
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

const transactionProjection = {
    key: "id",
    fields: {
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
} as const;

export class TransactionService {
    async list(input: z.infer<typeof listTransactionSchema>) {
        const { accountId, pagination, sorting, filters } = input;

        const whereFilters: SQL[] = accountId
            ? [eq(transactions.accountId, accountId)]
            : [];

        if (filters) {
            if (filters.keyword) {
                whereFilters.push(
                    ilike(transactions.description, "%" + filters.keyword + "%")
                );
            }

            if (filters.from) {
                whereFilters.push(gte(transactions.date, filters.from));
            }

            if (filters.to) {
                whereFilters.push(lte(transactions.date, filters.to));
            }

            if (
                filters.isConsolidated !== undefined &&
                filters.isConsolidated
            ) {
                whereFilters.push(
                    eq(transactions.amount, consolidationsSq.total)
                );
            }

            if (
                filters.isConsolidated !== undefined &&
                !filters.isConsolidated
            ) {
                whereFilters.push(
                    or(
                        ne(transactions.amount, consolidationsSq.total),
                        isNull(consolidationsSq.total)
                    )!
                );
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

        const { pageIndex, pageSize } = pagination;

        const { selection, transform } = createProjectedQuery(
            transactionProjection
        );

        const items = await db
            .select(selection)
            .from(transactions)
            .leftJoin(
                consolidationsSq,
                eq(transactions.id, consolidationsSq.transactionId)
            )
            .leftJoin(
                consolidations,
                eq(transactions.id, consolidations.transactionId)
            )
            .leftJoin(projects, eq(consolidations.projectId, projects.id))
            .where(and(...whereFilters))
            .orderBy(...orderBy)
            .offset(pageIndex * pageSize)
            .limit(pageSize);

        const { _count } = (
            await db.select({ _count: count() }).from(transactions)
        )[0];

        // For filtered count, we need to include the isConsolidated filter
        const filteredCountQuery = db
            .select({ filteredCount: count() })
            .from(transactions)
            .leftJoin(
                consolidationsSq,
                eq(transactions.id, consolidationsSq.transactionId)
            )
            .where(and(...whereFilters));

        const { filteredCount } = (await filteredCountQuery)[0];

        return {
            items: transform(items),
            count: _count,
            filteredCount,
        };
    }

    async get(id: string) {
        const { selection, transform } = createProjectedQuery(
            transactionProjection
        );
        const items = await db
            .select(selection)
            .from(transactions)
            .leftJoin(
                consolidationsSq,
                eq(transactions.id, consolidationsSq.transactionId)
            )
            .leftJoin(
                consolidations,
                eq(transactions.id, consolidations.transactionId)
            )
            .leftJoin(projects, eq(consolidations.projectId, projects.id))
            .where(eq(transactions.id, id))
            .limit(1);

        const result = transform(items);

        return result[0] ?? null;
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
