/**
 * Central env resolution for the frontend.
 *
 * NEXT_PUBLIC_* vars are inlined at build time on Vercel. When missing, we fall
 * back to the deployed production URLs so OAuth/API calls don't hit localhost.
 */

const PRODUCTION_API_URL =
  "https://pr-sentinel-backend-grz3.onrender.com/api";

const PRODUCTION_APP_URL = "https://pr-sentinel-test-frontend.vercel.app";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_API_URL
    : "http://localhost:3000/api");

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? PRODUCTION_APP_URL
    : "http://localhost:3001");

/**
 * Default number of free reviews allowed per user per day in FREE tier mode.
 * Configured via NEXT_PUBLIC_FREE_TIER_DAILY_LIMIT, NEXT_PUBLIC_FREE_TIER_LIMIT,
 * or NEXT_PUBLIC_FREE_TIER_REVIEWS. The fallback is only used when no valid
 * public environment variable is available at build time.
 */
export const DEFAULT_FREE_TIER_DAILY_LIMIT = 5;

const configuredFreeTierLimit =
  process.env.NEXT_PUBLIC_FREE_TIER_DAILY_LIMIT ??
  process.env.NEXT_PUBLIC_FREE_TIER_LIMIT ??
  process.env.NEXT_PUBLIC_FREE_TIER_REVIEWS;

const parsedFreeTierLimit = Number(configuredFreeTierLimit);

export const FREE_TIER_DAILY_LIMIT =
  Number.isFinite(parsedFreeTierLimit) && parsedFreeTierLimit > 0
    ? Math.floor(parsedFreeTierLimit)
    : DEFAULT_FREE_TIER_DAILY_LIMIT;

