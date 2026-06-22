import crypto from "node:crypto";
import type { DB } from "@/db/types";
import type { Insertable } from "kysely";
import { toUuid } from "@/lib/utils";

type Transaction = Insertable<DB["transactions"]>;

type AuthResult = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  id_token?: string;
  scope?: string;
};

type FrolloTransaction = {
  id: number;
  baseType: "credit" | "debit";
  status: "posted" | "pending";
  post_date: string;
  amount: {
    amount: number;
    currency: string;
  };
  description: {
    original: string;
    simple: string;
  };
};

const AUTH_BASE_URL = "https://auth.frollo.com.au";
const SCOPES = "offline_access openid email client";
const CLIENT_ID = process.env.FROLLO_CLIENT_ID!;
const TENANT_ID = process.env.FROLLO_TENANT_ID!;
const REDIRECT_URI = "frollo://authorize";

async function login(username: string, password: string) {
  console.log("Logging in...");
  const generateRandomString = (length: number): string =>
    crypto.randomBytes(length).toString("base64url").slice(0, length);

  const generateCodeChallenge = (codeVerifier: string): string =>
    crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  const parseCookies = (response: Response): Map<string, string> => {
    const cookies = new Map<string, string>();
    const setCookieHeaders = response.headers.getSetCookie();
    for (const cookie of setCookieHeaders) {
      const [nameValue] = cookie.split(";");
      const [name, value] = nameValue.split("=");
      if (name && value) {
        cookies.set(name.trim(), value.trim());
      }
    }
    return cookies;
  };

  const mergeCookies = (
    existing: Map<string, string>,
    newCookies: Map<string, string>,
  ): Map<string, string> => {
    const merged = new Map(existing);
    for (const [name, value] of newCookies) {
      merged.set(name, value);
    }
    return merged;
  };

  const cookiesToHeader = (cookies: Map<string, string>): string =>
    Array.from(cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");

  const codeVerifier = generateRandomString(43);
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateRandomString(43);
  const nonce = generateRandomString(43);

  let cookies = new Map<string, string>();

  // Step 1: Initial authorization request to get cookies and session
  const authParams = new URLSearchParams({
    nonce,
    response_type: "code",
    code_challenge_method: "S256",
    scope: SCOPES,
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    state,
  });

  const initResponse = await fetch(
    `${AUTH_BASE_URL}/oauth2/authorize/?${authParams}`,
    {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
      },
      redirect: "follow",
    },
  );

  cookies = mergeCookies(cookies, parseCookies(initResponse));

  // Step 2: POST login credentials
  const loginBody = new URLSearchParams({
    captcha_token: "",
    client_id: CLIENT_ID,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    "metaData.device.name": "iPhone/iPod Safari",
    "metaData.device.type": "BROWSER",
    nonce,
    oauth_context: "",
    pendingIdPLinkId: "",
    redirect_uri: REDIRECT_URI,
    response_mode: "",
    response_type: "code",
    scope: SCOPES,
    state,
    tenantId: TENANT_ID,
    timezone: "Australia/Sydney",
    user_code: "",
    showPasswordField: "true",
    userVerifyingPlatformAuthenticatorAvailable: "true",
    loginId: username,
    password: password,
    __cb_rememberDevice: "false",
    rememberDevice: "true",
  });

  let currentResponse = await fetch(`${AUTH_BASE_URL}/oauth2/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-AU,en;q=0.9",
      Origin: AUTH_BASE_URL,
      Referer: `${AUTH_BASE_URL}/`,
      Cookie: cookiesToHeader(cookies),
    },
    body: loginBody,
    redirect: "manual",
  });

  // Step 3: Follow redirects until we get the auth code
  let redirectLocation = currentResponse.headers.get("location");
  let maxRedirects = 5;

  while (redirectLocation && maxRedirects > 0) {
    // Check if this is the final redirect to frollo://
    if (redirectLocation.startsWith("frollo://")) {
      break;
    }

    // Make URL absolute if relative
    const absoluteUrl = redirectLocation.startsWith("http")
      ? redirectLocation
      : `${AUTH_BASE_URL}${redirectLocation}`;

    cookies = mergeCookies(cookies, parseCookies(currentResponse));

    currentResponse = await fetch(absoluteUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        Referer: `${AUTH_BASE_URL}/`,
        Cookie: cookiesToHeader(cookies),
      },
      redirect: "manual",
    });

    redirectLocation = currentResponse.headers.get("location");
    maxRedirects--;
  }

  if (!redirectLocation) {
    const responseBody = await currentResponse.text();
    const errorMatch = responseBody.match(/error_description[^"]*"([^"]+)"/);
    throw new Error(
      `Login failed: ${errorMatch?.[1] || "no redirect received"}`,
    );
  }

  // Extract authorization code from the redirect URL
  const redirectUrl = new URL(redirectLocation);
  const authCode = redirectUrl.searchParams.get("code");

  if (!authCode) {
    const error = redirectUrl.searchParams.get("error");
    const errorDescription = redirectUrl.searchParams.get("error_description");
    throw new Error(
      `Login failed: ${error || "no authorization code"}. ${errorDescription || ""}`,
    );
  }

  // Step 4: Exchange authorization code for tokens
  const tokenBody = new URLSearchParams({
    code: authCode,
    code_verifier: codeVerifier,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(`${AUTH_BASE_URL}/oauth2/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "Frollo/107301 CFNetwork/3860.200.71 Darwin/25.1.0",
      Accept: "*/*",
      "Accept-Language": "en-AU,en;q=0.9",
    },
    body: tokenBody,
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(
      `Token exchange failed: ${tokenResponse.status} - ${errorText}`,
    );
  }

  const tokenData = (await tokenResponse.json()) as AuthResult;

  return tokenData;
}

async function refresh(refreshToken: string) {
  console.log("Refreshing token...");
  const url = `${AUTH_BASE_URL}/oauth2/token/`;

  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
  });

  const headers = {
    Host: "auth.frollo.com.au",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Connection: "keep-alive",
    Accept: "*/*",
    "User-Agent": "Frollo/107301 CFNetwork/3860.300.31 Darwin/25.2.0",
    "Content-Length": body.toString().length.toString(),
    "Accept-Language": "en-AU,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as AuthResult;

  return data;
}

export async function getWestpacTransactions(
  accountId: string,
  options: {
    since?: Date;
    until?: Date;
    size?: number;
  } = {},
) {
  const baseUrl = "https://api.frollo.com.au/api/v2";

  let auth = await login(
    process.env.FROLLO_USERNAME!,
    process.env.FROLLO_PASSWORD!,
  );

  const headers = {
    Host: "api.frollo.com.au",
    "X-Api-Version": "2.29",
    "X-Software-Version": "SDK6.3.2-B632/APP3.34.0-B107301",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent": "Frollo/107301 CFNetwork/3860.300.31 Darwin/25.2.0",
    Connection: "keep-alive",
    Accept: "*/*",
    "Accept-Language": "en-AU,en;q=0.9",
    "X-Device-Version": "iOSVersion 26.2 (Build 23C55)",
    "X-Bundle-Id": "frollo-swift-sdk.FrolloSDK.resources",
  };

  // syncing first
  await fetch(`${baseUrl}/aggregation/provideraccounts/sync`, {
    method: "POST",
    headers: {
      ...headers,
      Authorization: `Bearer ${auth.access_token}`,
      "Content-Length": "0",
    },
  });

  const load = async (after: string | null) => {
    const params: Record<string, string> = {
      status: "posted",
      size: options?.size?.toString() ?? "100",
    };

    if (options?.since) {
      params["from_date"] = options.since.toISOString();
    }

    if (options?.until) {
      params["to_date"] = options.until.toISOString();
    }

    if (after) {
      params["after"] = after;
    }

    const query = new URLSearchParams(params);

    const response = await fetch(
      `${baseUrl}/aggregation/transactions?${query}`,
      {
        headers: {
          ...headers,
          Authorization: `Bearer ${auth.access_token}`,
        },
      },
    );

    if (response.status === 401) {
      auth = await refresh(auth.refresh_token);
      return await load(after);
    }

    if (!response.ok) {
      console.error("Failed to fetch transactions:", response.status);
      return { transactions: [], after: null };
    }

    const json = (await response.json()) as {
      data: FrolloTransaction[];
      paging: { cursors: { before: string | null; after: string | null } };
    };

    return { transactions: json.data, after: json.paging.cursors.after };
  };

  const transactions = [];
  let after = null;

  do {
    const { transactions: t, after: nextAfter } = await load(after);
    transactions.push(...t);
    after = nextAfter;
  } while (after);

  return transactions
    .filter((x) => x.status === "posted")
    .map((t) => {
      return {
        id: toUuid(t.id),
        accountId,
        date: new Date(t.post_date),
        description: t.description.original,
        amount: Math.round(t.amount.amount * 100),
      };
    }) satisfies Transaction[];
}
