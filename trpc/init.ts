import { auth } from "@/lib/auth";
import { resolveUserAccess } from "@/features/rbac/queries/resolve-user-access";
import { type Permission } from "@/features/rbac/schemas/rbac.schema";
import { initTRPC, TRPCError } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  const authData = await auth.api.getSession({
    headers: await headers(),
  });

  if (!authData?.user) {
    return {
      authData,
      permissions: [] as Permission[],
      roles: [] as {
        id: string;
        humanId: string | null;
        name: string;
        isBuiltIn: boolean;
      }[],
    };
  }

  const access = await resolveUserAccess(authData.user.id);

  return {
    authData,
    permissions: access.permissions,
    roles: access.roles,
  };
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.authData?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const permissionProcedure = (permission: Permission) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    if (!ctx.permissions.includes(permission)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return next({ ctx });
  });
