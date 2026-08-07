export type AuthProvider = "demo" | "github";

export type AuthUser = {
  id?: number;
  login?: string;
  name: string;
  email: string;
  initials: string;
  role?: string;
  avatar_url?: string | null;
  provider: AuthProvider;
};

export const DEMO_USER: AuthUser = {
  name: "Jordan Davis",
  email: "jordan@acme.dev",
  initials: "JD",
  role: "Admin",
  provider: "demo",
};

export const DEMO_AUTH_KEY = "pr-sentinel-demo-auth";
export const AUTH_USER_KEY = "pr-sentinel-auth-user";

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isDemoAuthenticated() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_AUTH_KEY) === "true";
}

export function isAuthenticated() {
  return isDemoAuthenticated() || Boolean(getStoredUser());
}

export function startDemoSession(user?: Partial<AuthUser>) {
  if (typeof window === "undefined") return;
  const nextUser = {
    ...DEMO_USER,
    ...user,
    provider: user?.provider ?? "demo",
    initials: user?.initials ?? DEMO_USER.initials,
  } satisfies AuthUser;
  window.localStorage.setItem(DEMO_AUTH_KEY, "true");
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
}

export function startGitHubSession(user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_AUTH_KEY, "true");
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function endDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUTH_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}
