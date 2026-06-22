import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createTransactionWithAccountIdSchema,
  listTransactionSchema,
  updateTransactionSchema,
} from "../schemas/transactions.shared-schema";
import { listTransactionsQuery } from "../queries/list-transactions.query";
import { getTransactionByIdQuery } from "../queries/get-transaction-by-id.query";
import { createTransactionMutation } from "../mutations/create-transaction.mutation";
import { deleteTransactionMutation } from "../mutations/delete-transaction.mutation";
import { updateTransactionMutation } from "../mutations/update-transaction.mutation";

export const transactionsRouter = createTRPCRouter({
  list: permissionProcedure("transactions.read")
    .input(listTransactionSchema)
    .query(async ({ input }) => {
      return await listTransactionsQuery(input);
    }),

  get: permissionProcedure("transactions.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getTransactionByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("transactions.create")
    .input(
      createTransactionWithAccountIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await createTransactionMutation(input);
    }),

  update: permissionProcedure("transactions.update")
    .input(
      updateTransactionSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      })),
    )
    .mutation(async ({ input }) => {
      return await updateTransactionMutation(input);
    }),

  delete: permissionProcedure("transactions.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteTransactionMutation(input.id);
    }),
});
