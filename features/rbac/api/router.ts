import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  permissionProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { listRoles } from "../queries/list-roles";
import { createRole } from "../mutations/create-role";
import { updateRole } from "../mutations/update-role";
import { deleteRole } from "../mutations/delete-role";
import {
  createRoleSchema,
  deleteRoleSchema,
  listRolesSchema,
  listUsersAccessSchema,
  setUserRolesSchema,
  updateRoleSchema,
} from "../schemas/rbac.schema";
import { getRoleById } from "../queries/get-role-by-id";
import { listUsersAccess } from "../queries/list-users-access";
import { setUserRoles } from "../mutations/set-user-roles";

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
      return await listRoles(input);
    }),

  getRole: permissionProcedure("rbac.roles.read")
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      const role = await getRoleById(input.id);

      if (!role) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return role;
    }),

  createRole: permissionProcedure("rbac.roles.manage")
    .input(createRoleSchema)
    .mutation(async ({ input }) => {
      return await createRole(input);
    }),

  updateRole: permissionProcedure("rbac.roles.manage")
    .input(updateRoleSchema)
    .mutation(async ({ input }) => {
      const existingRole = await getRoleById(input.id);

      if (!existingRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingRole.isBuiltIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Built-in roles cannot be modified.",
        });
      }

      const updatedRole = await updateRole(input);

      if (!updatedRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updatedRole;
    }),

  deleteRole: permissionProcedure("rbac.roles.manage")
    .input(deleteRoleSchema)
    .mutation(async ({ input }) => {
      const existingRole = await getRoleById(input.id);

      if (!existingRole) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existingRole.isBuiltIn) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Built-in roles cannot be deleted.",
        });
      }

      await deleteRole(input.id);
    }),

  listUsersAccess: permissionProcedure("rbac.assignments.manage")
    .input(listUsersAccessSchema)
    .query(async ({ input }) => {
      return await listUsersAccess(input);
    }),

  setUserRoles: permissionProcedure("rbac.assignments.manage")
    .input(setUserRolesSchema)
    .mutation(async ({ input }) => {
      const result = await setUserRoles(input);

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
