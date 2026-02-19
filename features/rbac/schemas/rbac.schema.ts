import { listSchema } from "@/shared/lib/schemas/util-schemas";
import { z } from "zod";

export const permissions = [
  "dashboard.read",

  "financialAccounts.read",
  "financialAccounts.create",
  "financialAccounts.update",
  "financialAccounts.delete",

  "transactions.read",
  "transactions.create",
  "transactions.update",
  "transactions.delete",

  "consolidations.read",
  "consolidations.create",
  "consolidations.update",
  "consolidations.delete",

  "projects.read",
  "projects.create",
  "projects.update",
  "projects.delete",

  "projectItems.read",
  "projectItems.create",
  "projectItems.update",
  "projectItems.delete",

  "loans.read",
  "loans.create",
  "loans.update",
  "loans.delete",

  "loanPayoffs.read",
  "loanPayoffs.create",
  "loanPayoffs.update",
  "loanPayoffs.delete",

  "rbac.roles.read",
  "rbac.roles.manage",
  "rbac.assignments.manage",
] as const;

export type Permission = (typeof permissions)[number];

export const permissionSchema = z.enum(permissions);

export const builtInRoleHumanIds = ["owner"] as const;

export const builtInRoleHumanIdSchema = z.enum(builtInRoleHumanIds);

export const ownerRoleHumanId = "owner" as const;

export const ownerRoleName = "Owner";

export const createRoleSchema = z.object({
  name: z.string().trim().min(1).max(256),
  description: z.string().trim().max(2000).optional(),
  permissions: z.array(permissionSchema).min(1),
});

export const updateRoleSchema = createRoleSchema
  .omit({ permissions: true })
  .safeExtend({
    id: z.uuid(),
    permissions: z.array(permissionSchema).min(1),
  });

export const deleteRoleSchema = z.object({
  id: z.uuid(),
});

export const setUserRolesSchema = z.object({
  userId: z.string().min(1),
  roleIds: z.array(z.uuid()),
});

export const rolesFilterSchema = z.object({
  keyword: z.string().optional(),
});

export const listRolesSchema = listSchema.safeExtend({
  filters: rolesFilterSchema.optional(),
});

export const usersAccessFilterSchema = z.object({
  keyword: z.string().optional(),
});

export const listUsersAccessSchema = listSchema.safeExtend({
  filters: usersAccessFilterSchema.optional(),
});
