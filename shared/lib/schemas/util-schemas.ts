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
    columnFilters: z
        .array(
            z.object({
                id: z.string(),
                value: z.unknown(),
            })
        )
        .optional(),
});

