import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";

export const THEME_DARK = "dark";
export const THEME_LIGHT = "light";
export const THEMES = [THEME_LIGHT, THEME_DARK] as const;
export const THEME_COOKIE_NAME = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_THEME = THEME_LIGHT;

export type Theme = (typeof THEMES)[number];

export const getThemeCookie = createIsomorphicFn()
  .server(() => {
    try {
      return (getCookie(THEME_COOKIE_NAME) ?? DEFAULT_THEME) as Theme;
    } catch {
      return DEFAULT_THEME;
    }
  })
  .client(() => {
    const prefix = `${THEME_COOKIE_NAME}=`;
    return (document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(prefix))
      ?.slice(prefix.length) ?? DEFAULT_THEME) as Theme;
  });

export function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}
