import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import { createBudgetCategoryMutation } from "../mutations/create-budget-category.mutation";
import { deleteBudgetCategoryMutation } from "../mutations/delete-budget-category.mutation";
import { updateBudgetCategoryMutation } from "../mutations/update-budget-category.mutation";
import { getBudgetCategoryByIdQuery } from "../queries/get-budget-category-by-id.query";
import { listBudgetCategoriesQuery } from "../queries/list-budget-categories.query";
import {
  createBudgetCategorySchema,
  listBudgetCategorySchema,
  updateBudgetCategorySchema,
} from "../schemas/budgets.shared-schema";

export const budgetCategoriesRouter = createTRPCRouter({
  list: permissionProcedure("budgetCategories.read")
    .input(listBudgetCategorySchema)
    .query(async ({ input }) => {
      return await listBudgetCategoriesQuery(input);
    }),

  get: permissionProcedure("budgetCategories.read")
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const item = await getBudgetCategoryByIdQuery(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return item;
    }),

  create: permissionProcedure("budgetCategories.create")
    .input(createBudgetCategorySchema)
    .mutation(async ({ input }) => {
      return await createBudgetCategoryMutation(input);
    }),

  update: permissionProcedure("budgetCategories.update")
    .input(updateBudgetCategorySchema)
    .mutation(async ({ input }) => {
      return await updateBudgetCategoryMutation(input);
    }),

  delete: permissionProcedure("budgetCategories.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteBudgetCategoryMutation(input.id);
    }),
});
