"use client";

/**
 * hooks.ts
 * SWR-based data hooks. Components consume these instead of calling fetch or
 * the api modules directly, so caching, revalidation and live updates are
 * handled in one place.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { ApiError } from "./client";
import { githubApi, getInstallUrl } from "./github";
import { repositoriesApi } from "./repositories";
import { pullRequestsApi } from "./pull-requests";
import { reviewsApi } from "./reviews";
import { pollingInterval, subscribeToPullRequest } from "./realtime";
import type {
  DashboardStats,
  PullRequest,
  PullRequestFilters,
  PullRequestStatus,
  Repository,
  Review,
} from "./types";

const swrDefaults: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: (err) => {
    // Don't hammer the API on auth/permission/not-found errors.
    if (err instanceof ApiError) return err.isServer || err.status === 0;
    return true;
  },
  errorRetryCount: 3,
};

const TERMINAL_PR: PullRequestStatus[] = ["REVIEWED", "FAILED"];

export { getInstallUrl };

// ─── GitHub connection ─────────────────────────────────────────────────────────

export function useGitHubInstallation() {
  const { data, error, isLoading, mutate } = useSWR(
    "github/installation",
    () => githubApi.getInstallation(),
    swrDefaults
  );
  return { status: data, error: error as ApiError | undefined, isLoading, refresh: mutate };
}

// ─── Repositories ─────────────────────────────────────────────────────────────

export function useRepositories() {
  const { data, error, isLoading, mutate } = useSWR(
    "repositories",
    () => repositoriesApi.list(),
    swrDefaults
  );
  return {
    repositories: data as Repository[] | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

export function useRepository(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["repository", id] : null,
    () => repositoriesApi.get(id as string),
    swrDefaults
  );
  return {
    repository: data as Repository | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

export function useRepositoryPullRequests(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["repository", id, "pull-requests"] : null,
    () => repositoriesApi.pullRequests(id as string),
    swrDefaults
  );
  return {
    pullRequests: data as PullRequest[] | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

// ─── Pull requests ─────────────────────────────────────────────────────────────

export function usePullRequests(filters: PullRequestFilters = {}) {
  const key = useMemo(
    () => ["pull-requests", JSON.stringify(filters)] as const,
    [filters]
  );
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => pullRequestsApi.list(filters),
    swrDefaults
  );
  return {
    pullRequests: data as PullRequest[] | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

/**
 * Live pull request detail. Uses WebSocket push as the primary update channel
 * and exponential-backoff polling as a fallback while the PR is not terminal.
 * Polling stops entirely once status is REVIEWED or FAILED.
 */
export function useLivePullRequest(id: string | undefined) {
  const attemptRef = useRef(0);
  const [live, setLive] = useState(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    id ? ["pull-request", id] : null,
    () => pullRequestsApi.get(id as string),
    {
      ...swrDefaults,
      refreshInterval: (latest: PullRequest | undefined) => {
        const isTerminal = !!latest && TERMINAL_PR.includes(latest.status);
        if (isTerminal) {
          attemptRef.current = 0;
          return 0;
        }
        attemptRef.current += 1;
        return pollingInterval({ isTerminal, attempt: attemptRef.current, live });
      },
    }
  );

  const status = data?.status;
  const isTerminal = !!status && TERMINAL_PR.includes(status);

  // Open a WebSocket subscription while the PR is still processing.
  useEffect(() => {
    if (!id || isTerminal) {
      setLive(false);
      return;
    }
    const unsubscribe = subscribeToPullRequest(id, {
      onChange: () => {
        void mutate();
      },
      onConnectionChange: setLive,
    });
    return unsubscribe;
  }, [id, isTerminal, mutate]);

  return {
    pullRequest: data as PullRequest | undefined,
    error: error as ApiError | undefined,
    isLoading,
    isValidating,
    isTerminal,
    live,
    refresh: mutate,
  };
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export function useReviews() {
  const { data, error, isLoading, mutate } = useSWR(
    "reviews",
    () => reviewsApi.list(),
    swrDefaults
  );
  return {
    reviews: data as Review[] | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

export function useReview(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["review", id] : null,
    () => reviewsApi.get(id as string),
    swrDefaults
  );
  return {
    review: data as Review | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

// ─── Dashboard summary ─────────────────────────────────────────────────────────

/**
 * Derives dashboard stats from the installation status and pull request list
 * so we don't invent a bespoke stats endpoint. Recent PRs are the 5 most
 * recently updated.
 */
export function useDashboardStats(): {
  stats: DashboardStats | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  refresh: () => void;
} {
  const install = useGitHubInstallation();
  const prs = usePullRequests();

  const connected = !!install.status?.connected;
  const error = (install.error ?? prs.error) as ApiError | undefined;
  const isLoading = install.isLoading || (connected && prs.isLoading);

  const stats = useMemo<DashboardStats | undefined>(() => {
    if (!install.status) return undefined;
    const list = prs.pullRequests ?? [];
    const recent = [...list]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 5);
    return {
      connected,
      repositoryCount: install.status.repositoryCount,
      pullRequestCount: list.length,
      reviewedCount: list.filter((p) => p.status === "REVIEWED").length,
      failedCount: list.filter((p) => p.status === "FAILED").length,
      recentPullRequests: recent,
    };
  }, [install.status, prs.pullRequests, connected]);

  return {
    stats,
    error,
    isLoading,
    refresh: () => {
      void install.refresh();
      void prs.refresh();
    },
  };
}
