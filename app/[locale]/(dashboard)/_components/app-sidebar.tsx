"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/navigation";
import { ChartPieIcon, CoinsIcon, FolderIcon, HomeIcon } from "lucide-react";
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
] as const;

export const AppSidebar = () => {
    const t = useTranslations("Common");
    const pathname = usePathname();

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
                            {items.map(item => {
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={item.link === pathname}
                                        >
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
        </Sidebar>
    );
};
