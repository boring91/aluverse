"use client";

import { Button } from "@/components/ui/button";
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
    <Button size="icon" variant="ghost" onClick={toggleTheme}>
      {theme === "dark" && isMounted ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
};

export const AppHeader = () => {
  return (
    <header className="h-16 flex items-center px-4 border-b w-full justify-between">
      <SidebarTrigger />

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </header>
  );
};
