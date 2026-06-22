import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { NuqsAdapter } from "nuqs/adapters/react";

import { NavigationProgress } from "@/components/NavigationProgress";
import { Toaster } from "@/components/ui/sonner";
import { getSessionFunction } from "@/features/auth/functions/get-session.function";
import { useTheme } from "@/hooks/use-theme";
import { ConfirmDialogProvider } from "@/lib/confirm-context";
import { TRPCProvider, trpcClient } from "@/trpc";
import type { TRPCProxy } from "@/trpc";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCProxy;
}>()({
  beforeLoad: async () => {
    const session = await getSessionFunction();
    return { user: session?.user ?? null };
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        content: "width=device-width, initial-scale=1",
        name: "viewport",
      },
      {
        title: "AluVerse",
      },
      {
        content: "#f5921b",
        name: "theme-color",
      },
    ],
    links: [
      {
        href: "/favicon.ico",
        rel: "icon",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        href: appCss,
        rel: "stylesheet",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className={theme === "dark" ? "dark" : undefined}>
        <NavigationProgress />
        <NuqsAdapter>
          <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
            <ConfirmDialogProvider>
              <div className="flex min-h-dvh flex-col overflow-clip">
                {children}
              </div>
            </ConfirmDialogProvider>
            <Toaster position="bottom-right" />
          </TRPCProvider>
        </NuqsAdapter>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
