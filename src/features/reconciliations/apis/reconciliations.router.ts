import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createReconciliationWithTransactionIdSchema,
  listReconciliationSchema,
  updateReconciliationSchema,
} from "../schemas/reconciliations.shared-schema";
import { listReconciliationsQuery } from "../queries/list-reconciliations.query";
import { getReconciliationByIdQuery } from "../queries/get-reconciliation-by-id.query";
import { createReconciliationMutation } from "../mutations/create-reconciliation.mutation";
import { updateReconciliationMutation } from "../mutations/update-reconciliation.mutation";
import { deleteReconciliationMutation } from "../mutations/delete-reconciliation.mutation";
import { getReconciliationDefaultsQuery } from "../queries/get-reconciliation-defaults.query";
import { getReconciliationStatisticsQuery } from "../queries/get-reconciliation-statistics.query";

export const reconciliationsRouter = createTRPCRouter({
  list: permissionProcedure("reconciliations.read")
    .input(listReconciliationSchema)
    .query(async ({ input }) => {
      return await listReconciliationsQuery(input);
    }),

  get: permissionProcedure("reconciliations.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getReconciliationByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("reconciliations.create")
    .input(
      createReconciliationWithTransactionIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createReconciliationMutation(input);
    }),

  update: permissionProcedure("reconciliations.update")
    .input(
      updateReconciliationSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateReconciliationMutation(input);
    }),

  delete: permissionProcedure("reconciliations.delete")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteReconciliationMutation(input.id);
    }),

  getDefault: permissionProcedure("reconciliations.read")
    .input(z.object({ transactionId: z.uuid() }))
    .query(async ({ input }) => {
      return await getReconciliationDefaultsQuery(input.transactionId);
    }),

  statistics: permissionProcedure("reconciliations.read").query(async () => {
    return await getReconciliationStatisticsQuery();
  }),
});
