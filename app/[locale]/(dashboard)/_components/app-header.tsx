"use client";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useRouter } from "@/i18n/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { LogOutIcon, MoonIcon, SunIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useState } from "react";

const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const isMounted = useIsMounted();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <Button size="icon" variant="ghost" onClick={toggleTheme}>
            {theme === "dark" && isMounted ? <SunIcon /> : <MoonIcon />}
        </Button>
    );
};

const UserNav = () => {
    const { data } = useSession();
    const tc = useTranslations("Common");
    const router = useRouter();
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <>
            <ConfirmDialog
                title={tc("logout")}
                description={tc("areYouSureYouWantToLogout")}
                onConfirm={handleSignOut}
                open={isConfirmDialogOpen}
                onOpenChange={setIsConfirmDialogOpen}
            />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <UserIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem className="flex flex-col gap-0.5 items-start">
                        <p className="text-sm">{data?.user?.name}</p>
                        <p className="text-muted-foreground text-xs">
                            {data?.user?.email}
                        </p>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setIsConfirmDialogOpen(true)}
                    >
                        <LogOutIcon />
                        <span>{tc("logout")}</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
};

export const AppHeader = () => {
    return (
        <header className="h-12 flex items-center px-4 border-b w-full justify-between">
            <SidebarTrigger />

            <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <UserNav />
            </div>
        </header>
    );
};
