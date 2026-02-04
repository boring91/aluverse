import { db } from "@/db";
import { listSchema } from "@/shared/lib/schemas/util-schemas";
import { z } from "zod";

export const listBudgetCategorySchema = listSchema;

export const createBudgetCategorySchema = z
  .object({
    name: z.string().min(1),
    humanId: z.string().min(1),
  })
  .superRefine(async (data, ctx) => {
    const existingCategory = await db
      .selectFrom("budgetCategories")
      .where("humanId", "=", data.humanId)
      .select(["id"])
      .executeTakeFirst();

    if (existingCategory) {
      ctx.addIssue({
        code: "custom",
        params: {
          code: "HUMAN_ID_NOT_AVAILABLE",
        },
        message: "HUMAN_ID_NOT_AVAILABLE",
        path: ["humanId"],
      });
    }
  });

export const updateBudgetCategorySchema = createBudgetCategorySchema.safeExtend(
  {
    id: z.uuid(),
  }
);

export const listBudgetCategoryAllocationSchema = listSchema.safeExtend({
  budgetCategoryId: z.uuid(),
});

export const createBudgetCategoryAllocationSchema = z.object({
  budgetCategoryId: z.uuid(),
  amount: z.number().min(1),
  effectiveDate: z.date(),
});

export const updateBudgetCategoryAllocationSchema =
  createBudgetCategoryAllocationSchema.safeExtend({
    id: z.uuid(),
  });
