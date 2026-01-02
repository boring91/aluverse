import { z } from "zod";

export const listSchema = z.object({
  pagination: z
    .object({
      pageIndex: z.number(),
      pageSize: z.number(),
    })
    .default({ pageIndex: 0, pageSize: 100 }),
  sorting: z
    .array(
      z.object({
        id: z.string(),
        desc: z.boolean(),
      })
    )
    .optional(),
});

// Generic filter schemas for reuse
export const dateRangeFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const booleanFilterSchema = z
  .enum(["true", "false", "all"])
  .optional()
  .transform((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  });

// Helper to create a list schema with typed filters
export const createListSchemaWithFilters = <T extends z.ZodRawShape>(
  filtersSchema: z.ZodObject<T>
) => {
  return listSchema.extend({
    filters: filtersSchema.optional(),
  });
};
