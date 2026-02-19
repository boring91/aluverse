import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { listRolesQuery } from "../queries/list-roles.query";
import { createRoleMutation } from "../mutations/create-role.mutation";
import { updateRoleMutation } from "../mutations/update-role.mutation";
import { deleteRoleMutation } from "../mutations/delete-role.mutation";
import {
  createRoleSchema,
  deleteRoleSchema,
  listRolesSchema,
  listUsersAccessSchema,
  setUserRolesSchema,
  updateRoleSchema,
} from "../schemas/rbac.shared-schema";
import { getRoleByIdQuery } from "../queries/get-role-by-id.query";
import { listUsersAccessQuery } from "../queries/list-users-access.query";
import { setUserRolesMutation } from "../mutations/set-user-roles.mutation";

export const rbacRouter = createTRPCRouter({
  myAccess: protectedProcedure.query(async ({ ctx }) => {
    return {
      permissions: ctx.permissions,
      roles: ctx.roles,
    };
  }),

  listRoles: permissionProcedure("rbac.roles.read")
    .input(listRolesSchema)
    .query(async ({ input }) => {
      return await listRolesQuery(input);
    }),

  getRole: permissionProcedure("rbac.roles.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const role = await getRoleByIdQuery(input.id);

      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return role;
    }),

  createRole: permissionProcedure("rbac.roles.manage")
    .input(createRoleSchema)
    .mutation(async ({ input }) => {
      return await createRoleMutation(input);
    }),

  updateRole: permissionProcedure("rbac.roles.manage")
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      const existingRole = await getRoleByIdQuery(input.id);

      if (!existingRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingRole.isBuiltIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Built-in roles cannot be modified.",
        });
      }

      const updatedRole = await updateRoleMutation(input);

      if (!updatedRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedRole;
    }),

  deleteRole: permissionProcedure("rbac.roles.manage")
    .input(deleteRoleSchema)
    .mutation(async ({ input }) => {
      const existingRole = await getRoleByIdQuery(input.id);

      if (!existingRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingRole.isBuiltIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Built-in roles cannot be deleted.",
        });
      }

      await deleteRoleMutation(input.id);
    }),

  listUsersAccess: permissionProcedure("rbac.assignments.manage")
    .input(listUsersAccessSchema)
    .query(async ({ input }) => {
      return await listUsersAccessQuery(input);
    }),

  setUserRoles: permissionProcedure("rbac.assignments.manage")
    .input(setUserRolesSchema)
    .mutation(async ({ input }) => {
      const result = await setUserRolesMutation(input);

      if (result.status === "invalid_roles") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more roles do not exist.",
        });
      }

      if (result.status === "last_owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one user must keep the owner role.",
        });
      }

      return result;
    }),
});
