import type { KeypayProblemDetails } from "./types";

type KeypayRequestMethod = "DELETE" | "GET" | "POST" | "PUT";

type KeypayRequestOptions = {
  path: string;
  method?: KeypayRequestMethod;
  body?: unknown;
  searchParams?: Record<string, boolean | number | string | null | undefined>;
  businessScoped?: boolean;
};

const KEYPAY_API_BASE_URL = "https://api.yourpayroll.com.au/api/v2";

function getRequiredEnv(name: "KEYPAY_API_KEY" | "KEYPAY_ORGANIZATION_ID") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function buildUrl(
  path: string,
  searchParams: KeypayRequestOptions["searchParams"],
  businessScoped: boolean,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const scopedPath = businessScoped
    ? `/business/${getRequiredEnv("KEYPAY_ORGANIZATION_ID")}${normalizedPath}`
    : normalizedPath;
  const url = new URL(`${KEYPAY_API_BASE_URL}${scopedPath}`);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

function formatErrorBody(body: KeypayProblemDetails | string | null) {
  if (!body) {
    return "No response body returned.";
  }

  if (typeof body === "string") {
    return body;
  }

  const title = typeof body.title === "string" ? body.title : null;
  const detail = typeof body.detail === "string" ? body.detail : null;

  if (title && detail) {
    return `${title}: ${detail}`;
  }

  if (title) {
    return title;
  }

  if (detail) {
    return detail;
  }

  return JSON.stringify(body);
}

async function parseResponseBody(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

export async function request<TResponse>({
  path,
  method = "GET",
  body,
  searchParams,
  businessScoped = true,
}: KeypayRequestOptions) {
  const apiKey = getRequiredEnv("KEYPAY_API_KEY");
  const response = await fetch(buildUrl(path, searchParams, businessScoped), {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseBody = (await parseResponseBody(response)) as
    | KeypayProblemDetails
    | TResponse
    | string
    | null;

  if (!response.ok) {
    throw new Error(
      `KeyPay request failed (${response.status} ${response.statusText}): ${formatErrorBody(
        responseBody as KeypayProblemDetails | string | null,
      )}`,
    );
  }

  return responseBody as TResponse;
}
