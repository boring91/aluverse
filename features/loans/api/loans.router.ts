import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createLoanSchema,
  listLoanSchema,
  updateLoanSchema,
} from "../schemas/loans.shared-schema";
import { listLoansQuery } from "../queries/list-loans.query";
import { getLoanByIdQuery } from "../queries/get-loan-by-id.query";
import { createLoanMutation } from "../mutations/create-loan.mutation";
import { updateLoanMutation } from "../mutations/update-loan.mutation";
import { deleteLoanMutation } from "../mutations/delete-loan.mutation";

export const loansRouter = createTRPCRouter({
  list: permissionProcedure("loans.read")
    .input(listLoanSchema)
    .query(async ({ input }) => {
      return await listLoansQuery(input);
    }),

  get: permissionProcedure("loans.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getLoanByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("loans.create")
    .input(
      createLoanSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoanMutation(input);
    }),

  update: permissionProcedure("loans.update")
    .input(
      updateLoanSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoanMutation(input);
    }),

  delete: permissionProcedure("loans.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoanMutation(input.id);
    }),
});
