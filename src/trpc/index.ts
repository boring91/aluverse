import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createIsomorphicFn } from "@tanstack/react-start";

import { resolveAppUrl } from "@/lib/client-utils";

import type { AppRouter } from "./router";

const getCookies = createIsomorphicFn()
  .server(async () => {
    const { getRequestHeaders } = await import("@tanstack/react-start/server");
    const cookie = getRequestHeaders().get("cookie");
    return cookie ? { cookie } : {};
  })
  .client(() => ({}));

const appUrl = resolveAppUrl();

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${appUrl}/api/trpc`,
      transformer: superjson,
      // During SSR the server calls its own `/api/trpc` over HTTP, which does
      // not carry the browser's auth cookie — so `createTRPCContext` would see
      // no session and `protectedProcedure` would 401. Forward the incoming
      // request's cookie on the server; in the browser it is sent automatically.
      // `getRequestHeaders` is server-only, so import it lazily behind the guard
      // to keep it out of the client bundle.
      async headers() {
        return await getCookies();
      },
    }),
  ],
});

export function makeTRPCProxy(queryClient: QueryClient) {
  return createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
}

export type TRPCProxy = ReturnType<typeof makeTRPCProxy>;

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();
