import { createAuthClient } from "better-auth/react";

import { resolveAppUrl } from "@/lib/client-utils";

const appUrl = resolveAppUrl();

export const authClient = createAuthClient({
  baseURL: appUrl,
});

export const { signIn, signUp, signOut, useSession } = authClient;
