import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ConsolidationService } from "../services/consolidation.service";
import {
    createConsolidationWithTransactionIdSchema,
    listConsolidationSchema,
    updateConsolidationSchema,
} from "../schemas/consolidation.schema";

const consolidationService = new ConsolidationService();

export const consolidationsRouter = createTRPCRouter({
    list: protectedProcedure
        .input(listConsolidationSchema)
        .query(async ({ input }) => {
            return await consolidationService.list(input);
        }),

    get: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .query(async ({ input }) => {
            return await consolidationService.get(input.id);
        }),

    create: protectedProcedure
        .input(
            createConsolidationWithTransactionIdSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await consolidationService.create(input);
        }),

    update: protectedProcedure
        .input(
            updateConsolidationSchema.transform(v => ({
                ...v,
                amount: v.amount * 100, // Convert dollars to cents
            }))
        )
        .mutation(async ({ input }) => {
            return await consolidationService.update(input);
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.uuid() }))
        .mutation(async ({ input }) => {
            return await consolidationService.delete(input.id);
        }),

    getDefault: protectedProcedure
        .input(z.object({ transactionId: z.uuid() }))
        .query(async ({ input }) => {
            return await consolidationService.getDefault(input.transactionId);
        }),

    statistics: protectedProcedure.query(async () => {
        return await consolidationService.statistics();
    }),
});
