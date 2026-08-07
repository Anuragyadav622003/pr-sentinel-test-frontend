"use client";

import { startGitHubSession } from "./demo-auth";

export function startGitHubOAuth(mode: "sign-in" | "sign-up") {
  window.location.assign(`/api/auth/github?mode=${mode}`);
}

export function completeGitHubOAuth(params: URLSearchParams | null) {
  const mode = params?.get("mode") || "sign-in";
  const fallback = params?.get("fallback") === "demo";

  if (fallback) {
    startGitHubSession({
      name: "Jordan Davis",
      email: "jordan@acme.dev",
      initials: "JD",
      role: "Admin",
      provider: "github",
    });
    return { success: true, mode, fallback: true };
  }

  const login = params?.get("login") || "github-user";
  const oauthName = params?.get("name") || login;
  const email = params?.get("email") || `${login}@users.noreply.github.com`;
  const avatarUrl = params?.get("avatar_url") || null;
  const initials = (oauthName || login)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "GH";

  startGitHubSession({
    name: oauthName,
    email,
    initials,
    role: "Engineer",
    avatar_url: avatarUrl,
    provider: "github",
  });

  return { success: true, mode, fallback: false };
}
