import { z } from "zod";
import { loanTypes } from "@/lib/constants";
import { listSchema, booleanFilterSchema } from "@/lib/shared-schemas";
import { calendarDateSchema, nullableCalendarDateSchema } from "@/lib/date";

export const createLoanSchema = z
  .object({
    type: z.enum(loanTypes),
    partyName: z.string().min(1),
    amount: z.number(),
    date: calendarDateSchema,
    dueDate: nullableCalendarDateSchema,
    notes: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "borrowed" && data.amount <= 0) {
      ctx.addIssue({
        code: "custom",
        params: {
          code: "BORROWED_LOAN_AMOUNT_MUST_BE_POSITIVE",
        },
        message: "Borrowed loan amount must be greater than zero",
        path: ["amount"],
      });
    }

    if (data.type === "lent" && data.amount >= 0) {
      ctx.addIssue({
        code: "custom",
        params: {
          code: "LENT_LOAN_AMOUNT_MUST_BE_NEGATIVE",
        },
        message: "Lent loan amount must be less than zero",
        path: ["amount"],
      });
    }
  });

export const updateLoanSchema = createLoanSchema.safeExtend({
  id: z.uuid(),
});

export const loanTypeFilterSchema = z
  .enum([...loanTypes, "all"])
  .optional()
  .transform((val) => {
    if (val === "all") return undefined;
    return val;
  });

export const loanFiltersSchema = z.object({
  keyword: z.string().optional(),
  type: loanTypeFilterSchema,
  isPaidOff: booleanFilterSchema.optional(),
  from: calendarDateSchema.optional(),
  to: calendarDateSchema.optional(),
});

export type LoanFilters = z.infer<typeof loanFiltersSchema>;

export const listLoanSchema = listSchema.safeExtend({
  filters: loanFiltersSchema.optional(),
});
