import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type { Permission } from "../schemas/rbac.shared-schema";

export function useRbacAccess() {
  const trpc = useTRPC();

  const { data, isPending } = useQuery(trpc.rbac.myAccess.queryOptions());

  const permissionSet = useMemo(
    () => new Set(data?.permissions ?? []),
    [data?.permissions],
  );

  const hasPermission = useCallback(
    (permission: Permission) => permissionSet.has(permission),
    [permissionSet],
  );

  return {
    permissions: data?.permissions ?? [],
    roles: data?.roles ?? [],
    hasPermission,
    isPending,
  };
}
