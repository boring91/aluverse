import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
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
  list: permissionProcedure("financialAccounts.read").query(async () => {
    return await listFinancialAccounts();
  }),

  get: permissionProcedure("financialAccounts.read")
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

  create: permissionProcedure("financialAccounts.create")
    .input(createFinancialAccountSchema)
    .mutation(async ({ input }) => {
      return await createFinancialAccount(input);
    }),

  update: permissionProcedure("financialAccounts.update")
    .input(updateFinancialAccountSchema)
    .mutation(async ({ input }) => {
      return await updateFinancialAccount(input);
    }),

  delete: permissionProcedure("financialAccounts.delete")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteFinancialAccount(input.id);
    }),

  syncWithBank: permissionProcedure("financialAccounts.update")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await syncFinancialAccountWithBank(input.id);
    }),
});

export const transactionsRouter = createTRPCRouter({
  list: permissionProcedure("transactions.read")
    .input(listTransactionSchema)
    .query(async ({ input }) => {
      return await listTransactions(input);
    }),

  get: permissionProcedure("transactions.read")
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

  create: permissionProcedure("transactions.create")
    .input(
      createTransactionWithAccountIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createTransaction(input);
    }),

  update: permissionProcedure("transactions.update")
    .input(
      updateTransactionSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateTransaction(input);
    }),

  delete: permissionProcedure("transactions.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteTransaction(input.id);
    }),
});
