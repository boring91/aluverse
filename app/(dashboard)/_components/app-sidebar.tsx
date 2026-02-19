"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRbacAccess } from "@/features/rbac/hooks/use-rbac-access";
import { type Permission } from "@/features/rbac/schemas/rbac.shared-schema";
import { signOut, useSession } from "@/lib/auth-client";
import { useConfirm } from "@/lib/confirm-context";
import {
  ChartPieIcon,
  ChevronsUpDown,
  CoinsIcon,
  FolderIcon,
  HomeIcon,
  LogOutIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const mainItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    link: "/",
    icon: HomeIcon,
    permission: "dashboard.read" satisfies Permission,
  },
  {
    id: "projects",
    label: "Projects",
    link: "/projects",
    icon: FolderIcon,
    permission: "projects.read" satisfies Permission,
  },
  {
    id: "financialAccounts",
    label: "Financial accounts",
    link: "/financial-accounts",
    icon: CoinsIcon,
    permission: "financialAccounts.read" satisfies Permission,
  },
  {
    id: "reconciliations",
    label: "Reconciliations",
    link: "/reconciliations",
    icon: ChartPieIcon,
    permission: "reconciliations.read" satisfies Permission,
  },
  {
    id: "loans",
    label: "Loans",
    link: "/loans",
    icon: ReceiptIcon,
    permission: "loans.read" satisfies Permission,
  },
  {
    id: "budget",
    label: "Budget",
    link: "/budgets",
    icon: WalletIcon,
    permission: "budgetCategories.read" satisfies Permission,
  },
] as const;

const settingsItems = [
  {
    id: "accessControl",
    label: "Access Control",
    link: "/access-control",
    icon: ShieldCheckIcon,
    permissionsAny: [
      "rbac.roles.read",
      "rbac.assignments.manage",
    ] satisfies Permission[],
  },
  {
    id: "users",
    label: "Users",
    link: "/users",
    icon: UsersIcon,
    permission: "users.read" satisfies Permission,
  },
] as const;

type SidebarItem = (typeof mainItems)[number] | (typeof settingsItems)[number];

function UserNav() {
  const { confirm } = useConfirm();
  const { data } = useSession();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarFallback className="rounded-lg">
              {data?.user.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{data?.user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {data?.user.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {data?.user.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{data?.user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {data?.user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            confirm({
              title: "Logout",
              description: "Are you sure you want to logout?",
              onConfirm: handleSignOut,
            })
          }
        >
          <LogOutIcon />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { hasPermission, isPending } = useRbacAccess();

  const hasItemAccess = (item: SidebarItem) => {
    if ("permissionsAny" in item) {
      return item.permissionsAny.some((permission) =>
        hasPermission(permission)
      );
    }

    return hasPermission(item.permission);
  };

  const isActive = (link: string) => {
    if (pathname === "/" && link === "/") {
      return true;
    }

    return link !== "/" && pathname.startsWith(link);
  };

  const visibleMainItems = isPending
    ? mainItems
    : mainItems.filter((item) => hasItemAccess(item));

  const visibleSettingsItems = isPending
    ? settingsItems
    : settingsItems.filter((item) => hasItemAccess(item));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-xl">
          AluVerse
        </div>
      </SidebarHeader>
      <SidebarContent>
        {visibleMainItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item) => (
                  <SidebarMenuItem
                    key={isPending ? `main-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton showIcon />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link href={item.link as Route}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {visibleSettingsItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSettingsItems.map((item) => (
                  <SidebarMenuItem
                    key={isPending ? `settings-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton showIcon />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link href={item.link as Route}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <UserNav />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
