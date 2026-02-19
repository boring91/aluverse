import { z } from "zod";
import { booleanFilterSchema, listSchema } from "@/lib/shared-schemas";

export const createProjectSchema = z.object({
  client: z.string().min(1),
  title: z.string().min(1),
  visitDate: z.date().nullable().optional(),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  address: z.string().nullable().optional(),
  meters: z.number().nullable().optional(),
  price: z.number().min(0),
  margin: z.number().min(0).max(1),
  budgetUnits: z.number().min(0),
});

export const updateProjectSchema = createProjectSchema.safeExtend({
  id: z.uuid(),
});

export const projectStatusFilterSchema = z
  .enum(["planning", "inProgress", "awaitingPayment", "completed", "all"])
  .optional()
  .transform((val) => {
    if (val === "all") return undefined;
    return val;
  });

export const projectFiltersSchema = z.object({
  keyword: z.string().optional(),
  status: projectStatusFilterSchema.optional(),
  isConsolidated: booleanFilterSchema.optional(),
  from: z.date().optional(),
  to: z.date().optional(),
});

export type ProjectFilters = z.infer<typeof projectFiltersSchema>;

export const listProjectSchema = listSchema.safeExtend({
  filters: projectFiltersSchema.optional(),
});
