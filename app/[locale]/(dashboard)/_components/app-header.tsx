"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeSwitcher = () => {
    const { theme, setTheme } = useTheme();
    const isMounted = useIsMounted();

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" onClick={toggleTheme}>
                    {theme === "dark" && isMounted ? <SunIcon /> : <MoonIcon />}
                </Button>
            </DropdownMenuTrigger>
        </DropdownMenu>
    );
};

export const AppHeader = () => {
    return (
        <header className="h-12 flex items-center px-4 border-b w-full justify-between">
            <SidebarTrigger />

            <div>
                <ThemeSwitcher />
            </div>
        </header>
    );
};
