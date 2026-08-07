import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "sign-in";
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/github/complete?mode=${mode}&fallback=demo`, request.url));
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL(`/auth/github/complete?mode=${mode}&fallback=demo`, request.url));
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Missing access token");
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to fetch GitHub profile");
    }

    const userData = await userResponse.json();
    const emailResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
      },
    });

    const emailData = await emailResponse.json();
    const primaryEmail = Array.isArray(emailData)
      ? emailData.find((entry: { primary?: boolean; verified?: boolean; email?: string }) => entry.primary && entry.verified)?.email || emailData[0]?.email
      : null;

    const redirectUrl = new URL("http://localhost:3000/auth/github/complete");
    redirectUrl.searchParams.set("mode", mode);
    redirectUrl.searchParams.set("login", userData.login);
    redirectUrl.searchParams.set("name", userData.name || userData.login);
    redirectUrl.searchParams.set("email", primaryEmail || `${userData.login}@users.noreply.github.com`);
    redirectUrl.searchParams.set("avatar_url", userData.avatar_url || "");

    return NextResponse.redirect(redirectUrl);
  } catch {
    return NextResponse.redirect(new URL(`/auth/github/complete?mode=${mode}&fallback=demo`, request.url));
  }
}
