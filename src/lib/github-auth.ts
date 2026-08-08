"use client";

import { startGitHubSession } from "./demo-auth";

const GITHUB_OAUTH_URL = "https://github.com/login/oauth/authorize";
const DEFAULT_CALLBACK_PATH = "/auth/github/complete";

export function startGitHubOAuth(mode: "sign-in" | "sign-up") {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI || window.location.origin + DEFAULT_CALLBACK_PATH;
  const scope = "read:user user:email";

  if (!clientId) {
    window.location.assign(`${DEFAULT_CALLBACK_PATH}?mode=${mode}&error=missing_client_id`);
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state: mode,
  });

  window.location.assign(`${GITHUB_OAUTH_URL}?${params.toString()}`);
}

export function completeGitHubOAuth(params: URLSearchParams | null) {
  const mode = params?.get("mode") || "sign-in";
  const error = params?.get("error");

  if (error) {
    return { success: false, mode, error };
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

  return { success: true, mode };
}
