"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/client-utils";
import { toggleTheme, useTheme } from "@/hooks/use-theme";

type Props = {
  className?: string;
};

function ThemeSwitcher() {
  const theme = useTheme();

  return (
    <Button size="icon" variant="ghost" onClick={() => toggleTheme()}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

export function AppHeader({ className }: Props) {
  return (
    <header
      className={cn(
        "flex h-16 w-full items-center justify-between border-b px-4",
        className,
      )}
    >
      <SidebarTrigger />

      <div className="flex items-center gap-2">
        <ThemeSwitcher />
      </div>
    </header>
  );
}
