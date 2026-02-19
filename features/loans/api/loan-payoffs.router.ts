import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createLoanPayoffWithLoanIdSchema,
  listLoanPayoffSchema,
  updateLoanPayoffSchema,
} from "../schemas/loan-payoffs.shared-schema";
import { listLoanPayoffsQuery } from "../queries/list-loan-payoffs.query";
import { getLoanPayoffByIdQuery } from "../queries/get-loan-payoff-by-id.query";
import { createLoanPayoffMutation } from "../mutations/create-loan-payoff.mutation";
import { updateLoanPayoffMutation } from "../mutations/update-loan-payoff.mutation";
import { deleteLoanPayoffMutation } from "../mutations/delete-loan-payoff.mutation";

export const loanPayoffsRouter = createTRPCRouter({
  list: permissionProcedure("loanPayoffs.read")
    .input(listLoanPayoffSchema)
    .query(async ({ input }) => {
      return await listLoanPayoffsQuery(input);
    }),

  get: permissionProcedure("loanPayoffs.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getLoanPayoffByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("loanPayoffs.create")
    .input(
      createLoanPayoffWithLoanIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoanPayoffMutation(input);
    }),

  update: permissionProcedure("loanPayoffs.update")
    .input(
      updateLoanPayoffSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoanPayoffMutation(input);
    }),

  delete: permissionProcedure("loanPayoffs.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoanPayoffMutation(input.id);
    }),
});
