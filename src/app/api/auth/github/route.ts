import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "sign-in";
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:3000/api/auth/github/callback";

  if (!clientId) {
    return NextResponse.redirect(new URL(`/auth/github/complete?mode=${mode}&fallback=demo`, request.url));
  }

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "read:user user:email");
  authUrl.searchParams.set("state", `${mode}:${Date.now()}`);

  return NextResponse.redirect(authUrl);
}
