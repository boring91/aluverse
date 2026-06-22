import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const DEFAULT_LOCAL_APP_URL = "http://localhost:3000";
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "::1", "localhost"]);

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formQueryOptions = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
} as const;

export const resolveAppUrl = () => {
  const envAppUrl = import.meta.env.VITE_API_URL;

  if (typeof window === "undefined") {
    return envAppUrl ?? DEFAULT_LOCAL_APP_URL;
  }

  if (!envAppUrl) {
    return window.location.origin;
  }

  const currentOrigin = window.location.origin;

  try {
    const currentUrl = new URL(currentOrigin);
    const configuredUrl = new URL(envAppUrl);
    const isLocalPair =
      LOCAL_HOSTNAMES.has(currentUrl.hostname) &&
      LOCAL_HOSTNAMES.has(configuredUrl.hostname);

    if (isLocalPair && currentOrigin !== configuredUrl.origin) {
      return currentOrigin;
    }
  } catch {
    return currentOrigin;
  }

  return envAppUrl;
};
