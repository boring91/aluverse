import { z } from "zod";
import { calendarDateSchema } from "@/lib/date";

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
      }),
    )
    .optional(),
});

export const dateRangeFilterSchema = z.object({
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
});

export const booleanFilterSchema = z
  .enum(["true", "false", "all"])
  .optional()
  .transform((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  });
