import { db, transactions, consolidations, projects } from "@/db";
import {
    count,
    desc,
    asc,
    eq,
    ilike,
    and,
    sum,
    gte,
    lte,
    ne,
    or,
    isNull,
    SQL,
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
        const { accountId, pagination, sorting, columnFilters, filters } =
            input;

        const whereFilters: SQL[] = accountId
            ? [eq(transactions.accountId, accountId)]
            : [];

        // Handle column filters (legacy support)
        if (columnFilters) {
            for (const filter of columnFilters) {
                if (
                    filter.id === "description" &&
                    typeof filter.value === "string"
                ) {
                    whereFilters.push(
                        ilike(transactions.description, `%${filter.value}%`)
                    );
                }
            }
        }

        // Handle typed filters
        if (filters) {
            // Date range filter
            if (filters.dateRange) {
                if (filters.dateRange.from) {
                    whereFilters.push(gte(transactions.date, filters.dateRange.from));
                }
                if (filters.dateRange.to) {
                    whereFilters.push(lte(transactions.date, filters.dateRange.to));
                }
            }
        }

        // isConsolidated filter requires a separate having clause applied after joins
        // We'll handle it as a post-join filter
        const isConsolidatedFilter = filters?.isConsolidated;

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
                        orderBy.push(direction(transactions.amount));
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

        // Build the base query with isConsolidated filter
        let consolidatedWhereClause: SQL | undefined = undefined;
        if (isConsolidatedFilter === true) {
            // Consolidated: amount equals consolidated total
            consolidatedWhereClause = eq(
                transactions.amount,
                consolidationsSq.total
            );
        } else if (isConsolidatedFilter === false) {
            // Not consolidated: amount does not equal consolidated total OR no consolidations
            consolidatedWhereClause = or(
                ne(transactions.amount, consolidationsSq.total),
                isNull(consolidationsSq.total)
            );
        }

        const finalWhereClause =
            consolidatedWhereClause && whereFilters.length > 0
                ? and(...whereFilters, consolidatedWhereClause)
                : consolidatedWhereClause
                  ? consolidatedWhereClause
                  : whereFilters.length > 0
                    ? and(...whereFilters)
                    : undefined;

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
            .where(finalWhereClause)
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
            .where(finalWhereClause);

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
