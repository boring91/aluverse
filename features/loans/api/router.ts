import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { createLoanSchema, updateLoanSchema } from "../schemas/loan.schemas";
import {
  updateLoanPayoffSchema,
  listLoanPayoffSchema,
  createLoanPayoffWithLoanIdSchema,
} from "../schemas/loan-payoffs.schema";
import { listLoanSchema } from "../schemas/loan.schemas";
import { TRPCError } from "@trpc/server";
import { listLoans } from "../queries/list-loans";
import { getLoanById } from "../queries/get-loan-by-id";
import { createLoan } from "../mutations/create-loan";
import { updateLoan } from "../mutations/update-loan";
import { deleteLoanPayoff } from "../mutations/delete-loan-payoff";
import { listLoanPayoffs } from "../queries/list-loan-payoffs";
import { getLoanPayoffById } from "../queries/get-loan-payoff-by-id";
import { createLoanPayoff } from "../mutations/create-loan-payoff";
import { updateLoanPayoff } from "../mutations/update-loan-payoff";
import { deleteLoan } from "../mutations/delete-loan";

export const loansRouter = createTRPCRouter({
  list: permissionProcedure("loans.read")
    .input(listLoanSchema)
    .query(async ({ input }) => {
      return await listLoans(input);
    }),

  get: permissionProcedure("loans.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getLoanById(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return item;
    }),

  create: permissionProcedure("loans.create")
    .input(
      createLoanSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoan(input);
    }),

  update: permissionProcedure("loans.update")
    .input(
      updateLoanSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoan(input);
    }),

  delete: permissionProcedure("loans.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoan(input.id);
    }),
});

export const loanPayoffsRouter = createTRPCRouter({
  list: permissionProcedure("loanPayoffs.read")
    .input(listLoanPayoffSchema)
    .query(async ({ input }) => {
      return await listLoanPayoffs(input);
    }),

  get: permissionProcedure("loanPayoffs.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const items = await getLoanPayoffById(input.id);
      if (!items) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
      return items;
    }),

  create: permissionProcedure("loanPayoffs.create")
    .input(
      createLoanPayoffWithLoanIdSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoanPayoff(input);
    }),

  update: permissionProcedure("loanPayoffs.update")
    .input(
      updateLoanPayoffSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100), // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoanPayoff(input);
    }),

  delete: permissionProcedure("loanPayoffs.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoanPayoff(input.id);
    }),
});
