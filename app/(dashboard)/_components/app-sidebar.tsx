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
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const items = [
  {
    id: "dashboard",
    label: "Dashboard",
    link: "/",
    icon: HomeIcon,
  },
  {
    id: "projects",
    label: "Projects",
    link: "/projects",
    icon: FolderIcon,
  },
  {
    id: "financialAccounts",
    label: "Financial accounts",
    link: "/financial-accounts",
    icon: CoinsIcon,
  },
  {
    id: "consolidations",
    label: "Consolidations",
    link: "/consolidations",
    icon: ChartPieIcon,
  },
  {
    id: "loans",
    label: "Loans",
    link: "/loans",
    icon: ReceiptIcon,
  },
] as const;

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
          AluVerse
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
                        <span>{item.label}</span>
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
}
