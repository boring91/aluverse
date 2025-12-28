import {
    db,
    consolidations,
    transactions,
    projects,
    projectSupplies,
    projectLabors,
    projectMisc,
    projectPayments,
} from "@/db";
import { z } from "zod";
import { asc, desc, eq, ne, sql } from "drizzle-orm";
import {
    defineQuery,
    innerJoin,
    leftJoin,
    one,
    oneRequired,
} from "@/lib/server-utils";
import {
    createConsolidationWithTransactionIdSchema,
    listConsolidationSchema,
    updateConsolidationSchema,
} from "../schemas/consolidation.schema";

const consolidationsQuery = defineQuery({
    from: consolidations,
    key: "id",
    projection: {
        id: consolidations.id,
        amount: consolidations.amount,
        description: consolidations.description,
        isGst: consolidations.isGst,
        consolidationGroup: consolidations.consolidationGroup,
        budgetCategory: consolidations.budgetCategory,
        projectStream: consolidations.projectStream,
        projectItemId: consolidations.projectItemId,
        project: one({
            key: "id",
            fields: {
                id: projects.id,
                humanId: projects.humanId,
                title: projects.title,
            },
        }),
        transaction: oneRequired({
            key: "id",
            fields: {
                id: transactions.id,
                date: transactions.date,
                description: transactions.description,
                amount: transactions.amount,
                type: transactions.type,
            },
        }),
    },
    joins: [
        innerJoin(
            transactions,
            eq(consolidations.transactionId, transactions.id)
        ),
        leftJoin(projects, eq(consolidations.projectId, projects.id)),
    ],
});

export class ConsolidationService {
    async list(input: z.infer<typeof listConsolidationSchema>) {
        const { transactionId, pagination, sorting } = input;

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
                        orderBy.push(direction(consolidations.amount));
                        break;
                    default:
                        orderBy.push(desc(transactions.date));
                }
            });
        } else {
            orderBy.push(desc(transactions.date));
        }

        return await consolidationsQuery.list({
            baseWhere: [eq(consolidations.transactionId, transactionId)],
            pagination,
            orderBy,
        });
    }

    async get(id: string) {
        return await consolidationsQuery.get({
            where: [eq(consolidations.id, id)],
        });
    }

    async create(
        data: z.infer<typeof createConsolidationWithTransactionIdSchema>
    ) {
        return await db.transaction(async tx => {
            const consolidation = (
                await tx.insert(consolidations).values(data).returning()
            )[0];

            const { projectStream, projectItemId } = data;

            if (projectStream && projectItemId) {
                const tableMap = {
                    supplies: projectSupplies,
                    labors: projectLabors,
                    misc: projectMisc,
                    payments: projectPayments,
                };

                const idMap = {
                    supplies: projectSupplies.id,
                    labors: projectLabors.id,
                    misc: projectMisc.id,
                    payments: projectPayments.id,
                };

                await tx
                    .update(tableMap[projectStream])
                    .set({ consolidationId: consolidation.id })
                    .where(eq(idMap[projectStream], projectItemId));
            }

            return consolidation;
        });
    }

    async update(data: z.infer<typeof updateConsolidationSchema>) {
        return await db
            .update(consolidations)
            .set(data)
            .where(eq(consolidations.id, data.id))
            .returning();
    }

    async delete(id: string) {
        return await db
            .delete(consolidations)
            .where(eq(consolidations.id, id))
            .returning();
    }

    async getDefault(transactionId: string) {
        return (
            await db
                .select({
                    description: transactions.description,
                    remainingAmount: sql<number>`${transactions.amount} - COALESCE(SUM(${consolidations.amount}), 0)`,
                })
                .from(transactions)
                .leftJoin(
                    consolidations,
                    eq(transactions.id, consolidations.transactionId)
                )
                .where(eq(transactions.id, transactionId))
                .groupBy(transactions.id)
        )[0];
    }

    async statistics() {
        const pendingTransactions = await db
            .select({
                id: transactions.id,
                amount: transactions.amount,
                consolidationAmount: sql<number>`COALESCE(SUM(${consolidations.amount}), 0)`,
            })
            .from(transactions)
            .leftJoin(
                consolidations,
                eq(transactions.id, consolidations.transactionId)
            )
            .groupBy(transactions.id)
            .having(x => ne(x.amount, x.consolidationAmount));

        return {
            pendingConsolidationCount: pendingTransactions.length,
        };
    }
}
