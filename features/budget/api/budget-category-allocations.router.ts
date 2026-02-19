import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { createBudgetCategoryAllocationMutation } from "../mutations/create-budget-category-allocation.mutation";
import { deleteBudgetCategoryAllocationMutation } from "../mutations/delete-budget-category-allocation.mutation";
import { updateBudgetCategoryAllocationMutation } from "../mutations/update-budget-category-allocation.mutation";
import { getBudgetCategoryAllocationByIdQuery } from "../queries/get-budget-category-allocation-by-id.query";
import { listBudgetCategoryAllocationsQuery } from "../queries/list-budget-category-allocations.query";
import {
  createBudgetCategoryAllocationWithBudgetCategoryIdSchema,
  listBudgetCategoryAllocationSchema,
  updateBudgetCategoryAllocationSchema,
} from "../schemas/budgets.shared-schema";

export const budgetCategoryAllocationsRouter = createTRPCRouter({
  list: permissionProcedure("budgetCategoryAllocations.read")
    .input(listBudgetCategoryAllocationSchema)
    .query(async ({ input }) => {
      return await listBudgetCategoryAllocationsQuery(input);
    }),

  get: permissionProcedure("budgetCategoryAllocations.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const item = await getBudgetCategoryAllocationByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("budgetCategoryAllocations.create")
    .input(
      createBudgetCategoryAllocationWithBudgetCategoryIdSchema.transform(
        (v) => ({
          ...v,
          amount: Math.round(v.amount * 100),
        })
      )
    )
    .mutation(async ({ input }) => {
      return await createBudgetCategoryAllocationMutation(input);
    }),

  update: permissionProcedure("budgetCategoryAllocations.update")
    .input(
      updateBudgetCategoryAllocationSchema.transform((v) => ({
        ...v,
        amount: Math.round(v.amount * 100),
      }))
    )
    .mutation(async ({ input }) => {
      return await updateBudgetCategoryAllocationMutation(input);
    }),

  delete: permissionProcedure("budgetCategoryAllocations.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteBudgetCategoryAllocationMutation(input.id);
    }),
});
