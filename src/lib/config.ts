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
 * Configured via NEXT_PUBLIC_FREE_TIER_DAILY_LIMIT or NEXT_PUBLIC_FREE_TIER_REVIEWS env var.
 */
export const DEFAULT_FREE_TIER_DAILY_LIMIT = 5;

const rawLimit =
  process.env.NEXT_PUBLIC_FREE_TIER_DAILY_LIMIT ??
  process.env.NEXT_PUBLIC_FREE_TIER_REVIEWS;

export const FREE_TIER_DAILY_LIMIT =
  rawLimit && !isNaN(Number(rawLimit)) && Number(rawLimit) > 0
    ? Number(rawLimit)
    : DEFAULT_FREE_TIER_DAILY_LIMIT;

