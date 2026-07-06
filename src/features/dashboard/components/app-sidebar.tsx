import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  CalendarRangeIcon,
  CalculatorIcon,
  ChartPieIcon,
  ChevronsUpDown,
  CoinsIcon,
  FolderIcon,
  HomeIcon,
  LogOutIcon,
  ReceiptIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { useEffect } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
import type { Permission } from "@/features/rbac/schemas/rbac.shared-schema";
import { signOut, useSession } from "@/lib/auth-client";
import { useConfirm } from "@/lib/confirm-context";

const mainItems = [
  {
    icon: HomeIcon,
    id: "dashboard",
    label: "Dashboard",
    link: "/",
    permission: "dashboard.read" satisfies Permission,
  },
  {
    icon: FolderIcon,
    id: "projects",
    label: "Projects",
    link: "/projects",
    permission: "projects.read" satisfies Permission,
  },
  {
    icon: CoinsIcon,
    id: "financialAccounts",
    label: "Financial Accounts",
    link: "/financial-accounts",
    permission: "financialAccounts.read" satisfies Permission,
  },
  {
    icon: ChartPieIcon,
    id: "reconciliations",
    label: "Reconciliations",
    link: "/reconciliations",
    permission: "reconciliations.read" satisfies Permission,
  },
  {
    icon: ReceiptIcon,
    id: "loans",
    label: "Loans",
    link: "/loans",
    permission: "loans.read" satisfies Permission,
  },
  {
    icon: WalletIcon,
    id: "budget",
    label: "Budget",
    link: "/budgets",
    permission: "budgetCategories.read" satisfies Permission,
  },
] as const;

const payrollItems = [
  {
    icon: UsersIcon,
    id: "employees",
    label: "Employees",
    link: "/payroll/employees",
    permission: "payroll.read" satisfies Permission,
  },
  {
    icon: CalendarRangeIcon,
    id: "paySchedules",
    label: "Pay Schedules",
    link: "/payroll/pay-schedules",
    permission: "payroll.read" satisfies Permission,
  },
  {
    icon: ReceiptTextIcon,
    id: "payRuns",
    label: "Pay Runs",
    link: "/payroll/pay-runs",
    permission: "payroll.read" satisfies Permission,
  },
  {
    icon: SettingsIcon,
    id: "settings",
    label: "Settings",
    link: "/payroll/settings",
    permission: "payroll.read" satisfies Permission,
  },
] as const;

const gstItems = [
  {
    icon: ReceiptTextIcon,
    id: "pendingGst",
    label: "Pending GST",
    link: "/gst/pending",
    permission: "reconciliations.read" satisfies Permission,
  },
  {
    icon: ReceiptTextIcon,
    id: "gstPayments",
    label: "GST Payments",
    link: "/gst/payments",
    permission: "gst.read" satisfies Permission,
  },
] as const;

const sidebarSkeletonWidths = ["62%", "78%", "54%", "70%", "86%", "64%"];

const getSidebarSkeletonWidth = (index: number) => {
  return sidebarSkeletonWidths[index % sidebarSkeletonWidths.length];
};

const toolsItems = [
  {
    icon: CalculatorIcon,
    id: "priceCalculator",
    label: "Price Calculator",
    link: "/tools/price-calculator",
    permission: "projects.read" satisfies Permission,
  },
] as const;

const settingsItems = [
  {
    icon: ShieldCheckIcon,
    id: "accessControl",
    label: "Access Control",
    link: "/access-control",
    permissionsAny: [
      "rbac.roles.read",
      "rbac.assignments.manage",
    ] satisfies Permission[],
  },
  {
    icon: UsersIcon,
    id: "users",
    label: "Users",
    link: "/users",
    permission: "users.read" satisfies Permission,
  },
] as const;

type SidebarItem =
  | (typeof mainItems)[number]
  | (typeof payrollItems)[number]
  | (typeof gstItems)[number]
  | (typeof settingsItems)[number]
  | (typeof toolsItems)[number];

function UserNav() {
  const { confirm } = useConfirm();
  const navigate = useNavigate();
  const { data } = useSession();
  const { isMobile } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/login" });
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
        align="end"
        className="min-w-56"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuGroup>
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
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            confirm({
              title: "Logout",
              description: "Are you sure you want to logout?",
              onConfirm: () => {
                void handleSignOut();
              },
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
  const { hasPermission, isPending } = useRbacAccess();
  const { pathname } = useLocation();
  const { setOpenMobile } = useSidebar();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const hasItemAccess = (item: SidebarItem) => {
    if ("permissionsAny" in item) {
      return item.permissionsAny.some((permission) =>
        hasPermission(permission),
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
  const visiblePayrollItems = isPending
    ? payrollItems
    : payrollItems.filter((item) => hasItemAccess(item));
  const visibleGstItems = isPending
    ? gstItems
    : gstItems.filter((item) => hasItemAccess(item));
  const visibleToolsItems = isPending
    ? toolsItems
    : toolsItems.filter((item) => hasItemAccess(item));
  const visibleSettingsItems = isPending
    ? settingsItems
    : settingsItems.filter((item) => hasItemAccess(item));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-xl font-bold">
          AluVerse
        </div>
      </SidebarHeader>
      <SidebarContent>
        {visibleMainItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainItems.map((item, index) => (
                  <SidebarMenuItem
                    key={isPending ? `main-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton
                        showIcon
                        skeletonWidth={getSidebarSkeletonWidth(index)}
                      />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link to={item.link}>
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

        {visiblePayrollItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Payroll</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visiblePayrollItems.map((item, index) => (
                  <SidebarMenuItem
                    key={isPending ? `payroll-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton
                        showIcon
                        skeletonWidth={getSidebarSkeletonWidth(index)}
                      />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link to={item.link}>
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

        {visibleGstItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>GST</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleGstItems.map((item, index) => (
                  <SidebarMenuItem
                    key={isPending ? `gst-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton
                        showIcon
                        skeletonWidth={getSidebarSkeletonWidth(index)}
                      />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link to={item.link}>
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

        {visibleToolsItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleToolsItems.map((item, index) => (
                  <SidebarMenuItem
                    key={isPending ? `tools-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton
                        showIcon
                        skeletonWidth={getSidebarSkeletonWidth(index)}
                      />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link to={item.link}>
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
                {visibleSettingsItems.map((item, index) => (
                  <SidebarMenuItem
                    key={isPending ? `settings-loading-${item.id}` : item.id}
                  >
                    {isPending ? (
                      <SidebarMenuSkeleton
                        showIcon
                        skeletonWidth={getSidebarSkeletonWidth(index)}
                      />
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item.link)}>
                        <Link to={item.link}>
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
