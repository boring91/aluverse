import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createFinancialAccountSchema,
  updateFinancialAccountSchema,
} from "../schemas/financial-accounts.shared-schema";
import { listFinancialAccountsQuery } from "../queries/list-financial-accounts.query";
import { getFinancialAccountByIdQuery } from "../queries/get-financial-account-by-id.query";
import { createFinancialAccountMutation } from "../mutations/create-financial-account.mutation";
import { updateFinancialAccountMutation } from "../mutations/update-financial-account.mutation";
import { deleteFinancialAccountMutation } from "../mutations/delete-financial-account.mutation";
import { syncFinancialAccountWithBankMutation } from "../mutations/sync-financial-account-with-bank.mutation";

export const financialAccountsRouter = createTRPCRouter({
  list: permissionProcedure("financialAccounts.read").query(async () => {
    return await listFinancialAccountsQuery();
  }),

  get: permissionProcedure("financialAccounts.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getFinancialAccountByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("financialAccounts.create")
    .input(createFinancialAccountSchema)
    .mutation(async ({ input }) => {
      return await createFinancialAccountMutation(input);
    }),

  update: permissionProcedure("financialAccounts.update")
    .input(updateFinancialAccountSchema)
    .mutation(async ({ input }) => {
      return await updateFinancialAccountMutation(input);
    }),

  delete: permissionProcedure("financialAccounts.delete")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await deleteFinancialAccountMutation(input.id);
    }),

  syncWithBank: permissionProcedure("financialAccounts.update")
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      return await syncFinancialAccountWithBankMutation(input.id);
    }),
});
