import { z } from "zod";
import { transactionTypes } from "@/lib/constants";
import { listSchema } from "@/shared/lib/schemas/util-schemas";

export const listTransactionSchema = listSchema.safeExtend({
    accountId: z.uuid().optional(),
});

export const createTransactionSchema = z.object({
    date: z.date(),
    description: z.string().min(1),
    amount: z.number().min(1),
    type: z.enum(transactionTypes),
});

export const createTransactionWithAccountIdSchema =
    createTransactionSchema.safeExtend({
        accountId: z.uuid(),
    });

export const updateTransactionSchema = createTransactionSchema.safeExtend({
    id: z.uuid(),
});
