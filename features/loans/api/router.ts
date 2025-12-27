import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { LoanService } from "../services/loan.service";
import { LoanPayoffService } from "../services/loan-payoff.service";
import {
    createLoanSchema,
    updateLoanSchema,
} from "../schemas/loan.schema";
import {
    updateLoanPayoffSchema,
    listLoanPayoffSchema,
    createLoanPayoffSchemaWithLoanId,
} from "../schemas/loan-payoff.schema";
import { listSchema } from "@/shared/lib/schemas/util-schemas";

const loanService = new LoanService();
const loanPayoffService = new LoanPayoffService();

export const loansRouter = createTRPCRouter({
    list: protectedProcedure.input(listSchema).query(async ({ input }) => {
        return await loanService.list(input);
    }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            return await loanService.get(input.id);
        }),

    create: protectedProcedure
        .input(
            createLoanSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await loanService.create(input);
        }),

    update: protectedProcedure
        .input(
            updateLoanSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await loanService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await loanService.delete(input.id);
        }),
});

export const loanPayoffsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listLoanPayoffSchema)
        .query(async ({ input }) => {
            return await loanPayoffService.list(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await loanPayoffService.get(input.id);
        }),

    create: protectedProcedure
        .input(
            createLoanPayoffSchemaWithLoanId.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await loanPayoffService.create(input);
        }),

    update: protectedProcedure
        .input(
            updateLoanPayoffSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await loanPayoffService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return await loanPayoffService.delete(input.id);
        }),
});

