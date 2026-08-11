/**
 * client.ts
 * Centralized API client. Every request to the PR Sentinel backend goes
 * through here so error handling, credentials and response unwrapping are
 * consistent. No raw fetch() calls should live inside React components.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/** Success envelope the backend wraps every 2xx response in. */
interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

/** Error envelope the backend returns for non-2xx responses. */
interface ApiErrorBody {
  success: false;
  message: string;
  error?: {
    statusCode: number;
    errors?: string[];
  };
}

/**
 * Typed error thrown for any failed request. Carries the HTTP status so the
 * UI can branch on 401/403/404/409/422/429/5xx without parsing strings.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(status: number, message: string, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }

  get isAuth(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServer(): boolean {
    return this.status >= 500;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = defaultMessageFor(res.status);
  let details: string[] = [];
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (Array.isArray(body.error?.errors) && body.error!.errors!.length > 0) {
      details = body.error!.errors!;
    }
    if (body.message) message = body.message;
    else if (details.length > 0) message = details.join(". ");
  } catch {
    // Non-JSON error body — keep the status-based default message.
  }
  return new ApiError(res.status, message, details);
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Your session has expired.";
    case 403:
      return "You do not have access to this resource.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with the current state.";
    case 422:
      return "The request could not be validated.";
    case 429:
      return "Too many requests. Please slow down and try again.";
    default:
      return status >= 500
        ? "Something went wrong on our end."
        : "The request could not be completed.";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** JSON-serializable request body. */
  body?: unknown;
  /** Extra query params appended to the URL (undefined/null values are skipped). */
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Idempotency key for mutating requests that must not double-apply on retry. */
  idempotencyKey?: string;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const base = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return base;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Core request helper. Always sends cookies (credentials: "include") so the
 * backend can derive the authenticated user from the HttpOnly JWT — the
 * frontend never sends a userId.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, params, signal, idempotencyKey } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Unable to reach the PR Sentinel API. Check your connection.");
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  // Some endpoints (e.g. logout) may return 204 with no body.
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  const json = JSON.parse(text) as ApiSuccess<T> | T;
  // Unwrap the success envelope when present; otherwise return the raw body.
  if (json && typeof json === "object" && "success" in json && "data" in json) {
    return (json as ApiSuccess<T>).data;
  }
  return json as T;
}
