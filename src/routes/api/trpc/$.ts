import { createFileRoute } from "@tanstack/react-router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/trpc/router";
import { createTRPCContext } from "@/trpc/init";

async function handle(request: Request) {
  return await fetchRequestHandler({
    createContext: createTRPCContext,
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: async ({ request }) => await handle(request),
      POST: async ({ request }) => await handle(request),
    },
  },
});
