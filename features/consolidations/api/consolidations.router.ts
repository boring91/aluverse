import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createConsolidationWithTransactionIdSchema,
  listConsolidationSchema,
  updateConsolidationSchema,
} from "../schemas/consolidations.shared-schema";
import { listConsolidationsQuery } from "../queries/list-consolidations.query";
import { getConsolidationByIdQuery } from "../queries/get-consolidation-by-id.query";
import { createConsolidationMutation } from "../mutations/create-consolidation.mutation";
import { updateConsolidationMutation } from "../mutations/update-consolidation.mutation";
import { deleteConsolidationMutation } from "../mutations/delete-consolidation.mutation";
import { getConsolidationDefaultsQuery } from "../queries/get-consolidation-defaults.query";
import { getConsolidationStatisticsQuery } from "../queries/get-consolidation-statistics.query";

export const consolidationsRouter = createTRPCRouter({
  list: permissionProcedure("consolidations.read")
    .input(listConsolidationSchema)
    .query(async ({ input }) => {
      return await listConsolidationsQuery(input);
    }),

  get: permissionProcedure("consolidations.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getConsolidationByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("consolidations.create")
    .input(
      createConsolidationWithTransactionIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await createConsolidationMutation(input);
    }),

  update: permissionProcedure("consolidations.update")
    .input(
      updateConsolidationSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateConsolidationMutation(input);
    }),

  delete: permissionProcedure("consolidations.delete")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteConsolidationMutation(input.id);
    }),

  getDefault: permissionProcedure("consolidations.read")
    .input(z.object({ transactionId: z.uuid() }))
    .query(async ({ input }) => {
      return await getConsolidationDefaultsQuery(input.transactionId);
    }),

  statistics: permissionProcedure("consolidations.read").query(async () => {
    return await getConsolidationStatisticsQuery();
  }),
});
