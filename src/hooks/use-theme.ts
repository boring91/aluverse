import { create } from "zustand";

import type { Theme } from "@/lib/theme";
import { DEFAULT_THEME, getThemeCookie, setThemeCookie } from "@/lib/theme";

type State = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const useThemeStore = create<State>((set) => ({
  theme: typeof window === "undefined" ? DEFAULT_THEME : getThemeCookie(),
  setTheme: (theme) => {
    setThemeCookie(theme);
    set({ theme });
  },
}));

export function useTheme() {
  const theme = useThemeStore((state) => state.theme);
  return typeof window === "undefined" ? getThemeCookie() : theme;
}

export function toggleTheme() {
  const { setTheme, theme } = useThemeStore.getState();
  setTheme(theme === "dark" ? "light" : "dark");
}
