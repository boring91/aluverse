import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, permissionProcedure } from "@/trpc/init";
import {
  createUserSchema,
  listUsersSchema,
  updateUserSchema,
} from "../schemas/users.shared-schema";
import { listUserQuery } from "../queries/list-user.query";
import { getUserByIdQuery } from "../queries/get-user-by-id.query";
import { createUserMutation } from "../mutations/create-user.mutation";
import { updateUserMutation } from "../mutations/update-user.mutation";
import { deleteUserMutation } from "../mutations/delete-user.mutation";

export const usersRouter = createTRPCRouter({
  list: permissionProcedure("users.read")
    .input(listUsersSchema)
    .query(async ({ input }) => {
      return await listUserQuery(input);
    }),

  get: permissionProcedure("users.read")
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const item = await getUserByIdQuery(input.id);

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }

      return item;
    }),

  create: permissionProcedure("users.create")
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      try {
        return await createUserMutation(input);
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to create user.",
        });
      }
    }),

  update: permissionProcedure("users.update")
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      try {
        const item = await updateUserMutation(input);

        if (!item) {
          throw new TRPCError({
            code: "NOT_FOUND",
          });
        }

        return item;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error ? error.message : "Failed to update user.",
        });
      }
    }),

  delete: permissionProcedure("users.delete")
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      if (!(await deleteUserMutation(input.id))) {
        throw new TRPCError({
          code: "NOT_FOUND",
        });
      }
    }),
});
