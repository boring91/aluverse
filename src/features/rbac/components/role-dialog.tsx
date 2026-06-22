"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { AppRouter } from "@/trpc/router";
import {
  createRoleSchema,
  permissions,
  updateRoleSchema,
} from "../schemas/rbac.shared-schema";
import type { Permission } from "../schemas/rbac.shared-schema";

type Role = inferRouterOutputs<AppRouter>["rbac"]["listRoles"]["items"][number];

const permissionGroups = permissions.reduce<
  Partial<Record<string, Permission[]>>
>((acc, permission) => {
  const [resource] = permission.split(".");
  const group = acc[resource] ?? [];

  group.push(permission);
  acc[resource] = group;

  return acc;
}, {}) as Record<string, Permission[]>;

const permissionSet = new Set<string>(permissions);

const isPermission = (value: string): value is Permission => {
  return permissionSet.has(value);
};

const normalizeRolePermissions = (role: Role | null) => {
  if (!role) {
    return [] as Permission[];
  }

  return role.permissions.flatMap((item) => {
    if (typeof item === "string") {
      return isPermission(item) ? [item] : [];
    }

    if (
      typeof item === "object" &&
      "permission" in item &&
      typeof item.permission === "string" &&
      isPermission(item.permission)
    ) {
      return [item.permission];
    }

    return [];
  });
};

const getPermissionLabel = (permission: Permission) => {
  const [, action] = permission.split(".");
  return action.charAt(0).toUpperCase() + action.slice(1);
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role | null;
};

export function RoleDialog({ open, onOpenChange, role }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(
    normalizeRolePermissions(role),
  );

  const isUpdate = !!role;

  const createRoleAction = useMutation(
    trpc.rbac.createRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.rbac.listRoles.queryOptions({}));
        queryClient.invalidateQueries(trpc.rbac.myAccess.queryOptions());
        queryClient.invalidateQueries(
          trpc.rbac.listUsersAccess.queryOptions({}),
        );
        onOpenChange(false);
        toast.success("Role created successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateRoleAction = useMutation(
    trpc.rbac.updateRole.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.rbac.listRoles.queryOptions({}));
        queryClient.invalidateQueries(trpc.rbac.myAccess.queryOptions());
        queryClient.invalidateQueries(
          trpc.rbac.listUsersAccess.queryOptions({}),
        );
        onOpenChange(false);
        toast.success("Role updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isSubmitting = createRoleAction.isPending || updateRoleAction.isPending;

  const selectedPermissionSet = useMemo(
    () => new Set(selectedPermissions),
    [selectedPermissions],
  );

  const togglePermission = (permission: Permission, checked: boolean) => {
    if (checked) {
      if (selectedPermissionSet.has(permission)) {
        return;
      }

      setSelectedPermissions((current) => [...current, permission]);
      return;
    }

    setSelectedPermissions((current) =>
      current.filter((value) => value !== permission),
    );
  };

  const handleSubmit = async () => {
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: selectedPermissions,
    };

    if (role) {
      await updateRoleAction.mutateAsync(
        updateRoleSchema.parse({
          id: role.id,
          ...payload,
        }),
      );
      return;
    }

    await createRoleAction.mutateAsync(createRoleSchema.parse(payload));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (isSubmitting) {
          return;
        }

        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isUpdate ? "Edit Role" : "Create Role"}</DialogTitle>
          <DialogDescription>
            {isUpdate
              ? "Update role metadata and permission grants."
              : "Create a custom role and choose its permissions."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Role name"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <Badge variant="secondary">
                {selectedPermissions.length} selected
              </Badge>
            </div>

            <div className="border p-3 max-h-72 overflow-y-auto">
              <div className="grid gap-4">
                {Object.entries(permissionGroups).map(([resource, items]) => (
                  <div key={resource} className="grid gap-2">
                    <p className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                      {resource}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((permission) => (
                        <Label key={permission} className="cursor-pointer">
                          <Checkbox
                            checked={selectedPermissionSet.has(permission)}
                            onCheckedChange={(checked) =>
                              togglePermission(permission, checked === true)
                            }
                            disabled={isSubmitting}
                          />
                          {getPermissionLabel(permission)}
                        </Label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !name.trim() || !selectedPermissions.length
            }
          >
            {isUpdate ? "Save changes" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
