import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { FinancialAccountService } from "../services/financial-account.service";
import { TransactionService } from "../services/transaction.service";
import {
    createFinancialAccountSchema,
    updateFinancialAccountSchema,
} from "../schemas/financial-account.schema";
import {
    createTransactionWithAccountIdSchema,
    listTransactionSchema,
    updateTransactionSchema,
} from "../schemas/transaction.schema";

const financialAccountService = new FinancialAccountService();
const transactionService = new TransactionService();

export const financialAccountsRouter = createTRPCRouter({
    list: protectedProcedure.query(async () => {
        return await financialAccountService.list();
    }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await financialAccountService.get(input.id);
        }),

    create: protectedProcedure
        .input(createFinancialAccountSchema)
        .mutation(async ({ input }) => {
            return await financialAccountService.create(input);
        }),

    update: protectedProcedure
        .input(updateFinancialAccountSchema)
        .mutation(async ({ input }) => {
            return await financialAccountService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .mutation(async ({ input }) => {
            return await financialAccountService.delete(input.id);
        }),
});

export const transactionsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listTransactionSchema)
        .query(async ({ input }) => {
            return await transactionService.list(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await transactionService.get(input.id);
        }),

    create: protectedProcedure
        .input(
            createTransactionWithAccountIdSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await transactionService.create(input);
        }),

    update: protectedProcedure
        .input(
            updateTransactionSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await transactionService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await transactionService.delete(input.id);
        }),
});
