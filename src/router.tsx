import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { NotFound } from "@/components/NotFound";
import { makeQueryClient } from "@/lib/query-client";
import { makeTRPCProxy } from "@/trpc";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = makeQueryClient();
  const trpc = makeTRPCProxy(queryClient);

  const router = createRouter({
    context: { queryClient, trpc },
    defaultNotFoundComponent: NotFound,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
