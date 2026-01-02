"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { useConfirm } from "@/lib/confirm-context";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";
import {
  ChartPieIcon,
  ChevronsUpDown,
  CoinsIcon,
  FolderIcon,
  HomeIcon,
  LogOutIcon,
  ReceiptIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

const items = [
  {
    id: "dashboard",
    link: "/",
    icon: HomeIcon,
  },

  {
    id: "projects",
    link: "/projects",
    icon: FolderIcon,
  },

  {
    id: "financialAccounts",
    link: "/financial-accounts",
    icon: CoinsIcon,
  },

  {
    id: "consolidations",
    link: "/consolidations",
    icon: ChartPieIcon,
  },

  {
    id: "loans",
    link: "/loans",
    icon: ReceiptIcon,
  },
] as const;

const UserNav = () => {
  const { confirm } = useConfirm();

  const { data } = useSession();
  const { isMobile } = useSidebar();

  const tc = useTranslations("Common");
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              {/* <AvatarImage
                                src={user.avatar}
                                alt={data?.user.name}
                            /> */}
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
                title: tc("logout"),
                description: tc("areYouSureYouWantToLogout"),
                onConfirm: handleSignOut,
              })
            }
          >
            <LogOutIcon />
            {tc("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const AppSidebar = () => {
  const t = useTranslations("Common");
  const pathname = usePathname();

  const isActive = (link: string) => {
    if (pathname === "/" && link === "/") {
      return true;
    }
    return link !== "/" && pathname.startsWith(link);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-center gap-2 px-4 py-2 font-bold text-xl">
          {t("appName")}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild isActive={isActive(item.link)}>
                      <Link href={item.link}>
                        <item.icon />
                        <span>{t(item.id)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
};
