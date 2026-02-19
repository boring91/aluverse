import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createConsolidationWithTransactionIdSchema,
  listConsolidationSchema,
  updateConsolidationSchema,
} from "../schemas/consolidations.schema";
import { listConsolidations } from "../queries/list-consolidations";
import { getConsolidationById } from "../queries/get-consolidation-by-id";
import { createConsolidation } from "../mutations/create-consolidation";
import { updateConsolidation } from "../mutations/update-consolidation";
import { deleteConsolidation } from "../mutations/delete-consolidation";
import { getConsolidationDefaults } from "../queries/get-consolidation-defaults";
import { getConsolidationStatistics } from "../queries/get-consolidation-statistics";
import { TRPCError } from "@trpc/server";

export const consolidationsRouter = createTRPCRouter({
  list: permissionProcedure("consolidations.read")
    .input(listConsolidationSchema)
    .query(async ({ input }) => {
      return await listConsolidations(input);
    }),

  get: permissionProcedure("consolidations.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getConsolidationById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("consolidations.create")
    .input(
      createConsolidationWithTransactionIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createConsolidation(input);
    }),

  update: permissionProcedure("consolidations.update")
    .input(
      updateConsolidationSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateConsolidation(input);
    }),

  delete: permissionProcedure("consolidations.delete")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteConsolidation(input.id);
    }),

  getDefault: permissionProcedure("consolidations.read")
    .input(z.object({ transactionId: z.uuid() }))
    .query(async ({ input }) => {
      return await getConsolidationDefaults(input.transactionId);
    }),

  statistics: permissionProcedure("consolidations.read").query(async () => {
    return await getConsolidationStatistics();
  }),
});
