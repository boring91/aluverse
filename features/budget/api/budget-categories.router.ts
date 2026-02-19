import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "@/db";
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

const addHumanIdNotAvailableIssue = (ctx: z.RefinementCtx) => {
  ctx.addIssue({
    code: "custom",
    params: {
      code: "HUMAN_ID_NOT_AVAILABLE",
    },
    message: "HUMAN_ID_NOT_AVAILABLE",
    path: ["humanId"],
  });
};

const createBudgetCategoryInputSchema = createBudgetCategorySchema.superRefine(
  async (data, ctx) => {
    const existingCategory = await db
      .selectFrom("budgetCategories")
      .where("humanId", "=", data.humanId)
      .select(["id"])
      .executeTakeFirst();

    if (existingCategory) {
      addHumanIdNotAvailableIssue(ctx);
    }
  }
);

const updateBudgetCategoryInputSchema = updateBudgetCategorySchema.superRefine(
  async (data, ctx) => {
    const existingCategory = await db
      .selectFrom("budgetCategories")
      .where("humanId", "=", data.humanId)
      .where("id", "!=", data.id)
      .select(["id"])
      .executeTakeFirst();

    if (existingCategory) {
      addHumanIdNotAvailableIssue(ctx);
    }
  }
);

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
    .input(createBudgetCategoryInputSchema)
    .mutation(async ({ input }) => {
      return await createBudgetCategoryMutation(input);
    }),

  update: permissionProcedure("budgetCategories.update")
    .input(updateBudgetCategoryInputSchema)
    .mutation(async ({ input }) => {
      return await updateBudgetCategoryMutation(input);
    }),

  delete: permissionProcedure("budgetCategories.delete")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await deleteBudgetCategoryMutation(input.id);
    }),
});
