import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
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

export const loansRouter = createTRPCRouter({
  list: protectedProcedure.input(listLoanSchema).query(async ({ input }) => {
    return await listLoans(input);
  }),

  get: protectedProcedure
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

  create: protectedProcedure
    .input(
      createLoanSchema.transform((v) => ({
        ...v,
        amount: v.amount * 100, // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoan(input);
    }),

  update: protectedProcedure
    .input(
      updateLoanSchema.transform((v) => ({
        ...v,
        amount: v.amount * 100, // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoan(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoanPayoff(input.id);
    }),
});

export const loanPayoffsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listLoanPayoffSchema)
    .query(async ({ input }) => {
      return await listLoanPayoffs(input);
    }),

  get: protectedProcedure
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

  create: protectedProcedure
    .input(
      createLoanPayoffWithLoanIdSchema.transform((v) => ({
        ...v,
        amount: v.amount * 100, // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await createLoanPayoff(input);
    }),

  update: protectedProcedure
    .input(
      updateLoanPayoffSchema.transform((v) => ({
        ...v,
        amount: v.amount * 100, // Convert dollars to cents
      }))
    )
    .mutation(async ({ input }) => {
      return await updateLoanPayoff(input);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteLoanPayoff(input.id);
    }),
});
