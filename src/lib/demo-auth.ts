export const DEMO_USER = {
  name: "Jordan Davis",
  email: "jordan@acme.dev",
  initials: "JD",
  role: "Admin",
};

export const DEMO_AUTH_KEY = "pr-sentinel-demo-auth";

export function isDemoAuthenticated() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_AUTH_KEY) === "true";
}

export function startDemoSession() {
  window.localStorage.setItem(DEMO_AUTH_KEY, "true");
}

export function endDemoSession() {
  window.localStorage.removeItem(DEMO_AUTH_KEY);
}
