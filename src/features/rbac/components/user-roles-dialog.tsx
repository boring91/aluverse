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
import { Label } from "@/components/ui/label";
import { setUserRolesSchema } from "@/features/rbac/schemas/rbac.shared-schema";
import type { AppRouter } from "@/trpc/router";
import { useTRPC } from "@/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Role = inferRouterOutputs<AppRouter>["rbac"]["listRoles"]["items"][number];
type UserAccess =
  inferRouterOutputs<AppRouter>["rbac"]["listUsersAccess"]["items"][number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserAccess | null;
  roles: Role[];
};

const getUserRoleIds = (user: UserAccess | null) => {
  if (!user) {
    return [] as string[];
  }

  return user.roles.flatMap((role) => {
    if (typeof role === "object" && "id" in role && role.id) {
      return [role.id];
    }

    return [];
  });
};

export function UserRolesDialog({ open, onOpenChange, user, roles }: Props) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(
    getUserRoleIds(user),
  );

  const setUserRolesAction = useMutation(
    trpc.rbac.setUserRoles.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.rbac.listUsersAccess.queryOptions({}),
        );
        queryClient.invalidateQueries(trpc.rbac.myAccess.queryOptions());
        onOpenChange(false);
        toast.success("User roles updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const selectedRoleIdSet = useMemo(
    () => new Set(selectedRoleIds),
    [selectedRoleIds],
  );

  const toggleRole = (roleId: string, checked: boolean) => {
    if (checked) {
      if (selectedRoleIdSet.has(roleId)) {
        return;
      }

      setSelectedRoleIds((current) => [...current, roleId]);
      return;
    }

    setSelectedRoleIds((current) => current.filter((id) => id !== roleId));
  };

  const handleSave = async () => {
    if (!user) {
      return;
    }

    await setUserRolesAction.mutateAsync(
      setUserRolesSchema.parse({
        userId: user.id,
        roleIds: selectedRoleIds,
      }),
    );
  };

  const isSubmitting = setUserRolesAction.isPending;

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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Manage role assignments for {user?.name ?? "selected user"}.
          </DialogDescription>
        </DialogHeader>

        <div className="border p-3 max-h-72 overflow-y-auto">
          {roles.length ? (
            <div className="grid gap-2">
              {roles.map((role) => (
                <Label key={role.id} className="cursor-pointer justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedRoleIdSet.has(role.id)}
                      onCheckedChange={(checked) =>
                        toggleRole(role.id, checked === true)
                      }
                      disabled={isSubmitting}
                    />
                    <span>{role.name}</span>
                  </div>

                  {role.isBuiltIn ? (
                    <Badge variant="secondary">Built-in</Badge>
                  ) : null}
                </Label>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No roles available.</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !user}>
            Save assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
