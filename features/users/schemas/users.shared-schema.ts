import { listSchema } from "@/lib/shared-schemas";
import { z } from "zod";

export const usersFilterSchema = z.object({
  keyword: z.string().optional(),
});

export const listUsersSchema = listSchema.safeExtend({
  filters: usersFilterSchema.optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email(),
  password: z.string().trim().min(8),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .safeExtend({
    id: z.string().min(1),
    password: z.string().trim().min(8).or(z.literal("")).optional(),
  });
