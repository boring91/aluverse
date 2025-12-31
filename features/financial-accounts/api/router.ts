import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import {
    createFinancialAccountSchema,
    updateFinancialAccountSchema,
} from "../schemas/financial-accounts.schema";
import {
    createTransactionWithAccountIdSchema,
    listTransactionSchema,
    updateTransactionSchema,
} from "../schemas/transactions.schema";
import { TRPCError } from "@trpc/server";
import { listFinancialAccounts } from "../queries/list-financial-accounts";
import { getFinancialAccountById } from "../queries/get-financial-account-by-id";
import { createFinancialAccount } from "../mutations/create-financial-account";
import { updateFinancialAccount } from "../mutations/update-financial-account";
import { deleteFinancialAccount } from "../mutations/delete-financial-account";
import { listTransactions } from "../queries/list-transactions";
import { getTransactionById } from "../queries/get-transaction-by-id";
import { createTransaction } from "../mutations/create-transaction";
import { deleteTransaction } from "../mutations/delete-transaction";
import { updateTransaction } from "../mutations/update-transaction";
import { syncFinancialAccountWithBank } from "../mutations/sync-financial-account-with-bank";

export const financialAccountsRouter = createTRPCRouter({
    list: protectedProcedure.query(async () => {
        return await listFinancialAccounts();
    }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const item = await getFinancialAccountById(input.id);
            if (!item) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                });
            }
            return item;
        }),

    create: protectedProcedure
        .input(createFinancialAccountSchema)
        .mutation(async ({ input }) => {
            return await createFinancialAccount(input);
        }),

    update: protectedProcedure
        .input(updateFinancialAccountSchema)
        .mutation(async ({ input }) => {
            return await updateFinancialAccount(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .mutation(async ({ input }) => {
            return await deleteFinancialAccount(input.id);
        }),

    syncWithBank: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .mutation(async ({ input }) => {
            return await syncFinancialAccountWithBank(input.id);
        }),
});

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listTransactionSchema)
        .query(async ({ input }) => {
            return await listTransactions(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            const items = await getTransactionById(input.id);
            if (!items) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                });
            }
            return items;
        }),

    create: protectedProcedure
        .input(
            createTransactionWithAccountIdSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await createTransaction(input);
        }),

    update: protectedProcedure
        .input(
            updateTransactionSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await updateTransaction(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await deleteTransaction(input.id);
        }),
});
