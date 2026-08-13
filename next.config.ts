import type { NextConfig } from "next";

// Fail the Vercel build if the API URL was not configured — otherwise the
// client bundle falls back to localhost and GitHub OAuth breaks in production.
if (process.env.VERCEL && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is missing. Set it in Vercel → Settings → Environment Variables, then redeploy.",
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
