/**
 * auth.ts
 * Single source of truth for authentication state and API calls.
 * No demo/mock code — all operations hit the real NestJS backend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  githubId?: string;
  githubLogin?: string;
  email: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape the backend wraps every success response in. */
interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

/** Shape the backend returns on errors. */
interface ApiError {
  success: false;
  message: string;
  error: {
    statusCode: number;
    errors?: string[];
  };
}

// ─── Session storage (localStorage) ──────────────────────────────────────────

const SESSION_KEY = "pr_sentinel_user";

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

/** True when a user object is present in localStorage. */
export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

/** Extract the error message from a failed response body. */
async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as ApiError;
    if (Array.isArray(body.error?.errors) && body.error.errors.length > 0) {
      return body.error.errors.join(". ");
    }
    return body.message || fallback;
  } catch {
    return fallback;
  }
}

// ─── Auth API calls ───────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates a new account. Sets the HttpOnly JWT cookie via the backend.
 * Stores the returned user in localStorage.
 */
export async function register(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // required so the browser saves the Set-Cookie header
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Registration failed"));
  }

  const body = (await res.json()) as ApiSuccess<{ user: AuthUser }>;
  setStoredUser(body.data.user);
  return body.data.user;
}

/**
 * POST /api/auth/login
 * Signs in with email + password. Sets the HttpOnly JWT cookie via the backend.
 * Stores the returned user in localStorage.
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res, "Invalid email or password"));
  }

  const body = (await res.json()) as ApiSuccess<{ user: AuthUser }>;
  setStoredUser(body.data.user);
  return body.data.user;
}

/**
 * GET /api/auth/me
 * Validates the current JWT cookie and returns the user.
 * Used after GitHub OAuth to hydrate the session.
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Session expired or not authenticated");
  }

  const body = (await res.json()) as ApiSuccess<AuthUser>;
  setStoredUser(body.data);
  return body.data;
}

/**
 * POST /api/auth/logout
 * Clears the HttpOnly cookie on the backend and removes localStorage state.
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore network errors — still clear local state
  } finally {
    clearStoredUser();
  }
}

/**
 * Redirect the browser to the backend GitHub OAuth entry point.
 * The backend will redirect back to /auth/callback after success.
 */
export function startGitHubOAuth(): void {
  window.location.assign(`${API_URL}/auth/github?redirect=/dashboard`);
}

/** Build the display name from an AuthUser. */
export function getDisplayName(user: AuthUser): string {
  return user.githubLogin || user.email || "User";
}

/** Build 1–2 character initials from an AuthUser. */
export function getInitials(user: AuthUser): string {
  const name = getDisplayName(user);
  return (
    name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}
