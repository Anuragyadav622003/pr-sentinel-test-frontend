"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR, { type SWRConfiguration } from "swr";
import { ApiError } from "./client";
import { getInstallUrl } from "./github";
import { repositoriesApi } from "./repositories";
import { pullRequestsApi } from "./pull-requests";
import { reviewsApi } from "./reviews";
import { pollingInterval, subscribeToPullRequest } from "./realtime";
import {
  useGitHubConnection,
  type GitHubConnectionState,
} from "@/lib/store/useGitHubConnection";
import type {
  DashboardStats,
  GitHubInstallationStatus,
  PullRequest,
  PullRequestFilters,
  PullRequestStatus,
  Repository,
  RepositorySummary,
  Review,
} from "./types";

const swrDefaults: SWRConfiguration = {
  revalidateOnFocus: false,
  shouldRetryOnError: (err) => {
    if (err instanceof ApiError) return err.isServer || err.status === 0;
    return true;
  },
  errorRetryCount: 3,
};

const TERMINAL_PR: PullRequestStatus[] = ["REVIEWED", "FAILED"];

export { getInstallUrl };

// ─── GitHub connection (RTK Query + Redux) ───────────────────────────────────

/** @deprecated Use useGitHubConnection() — kept for gradual migration. */
export function useGitHubInstallation(): {
  status: GitHubInstallationStatus | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  refresh: () => void;
  connection: GitHubConnectionState;
} {
  const connection = useGitHubConnection();

  const status = useMemo<GitHubInstallationStatus | undefined>(() => {
    if (!connection.initialized && connection.isChecking) return undefined;
    return {
      connected: connection.connected,
      installation: connection.installation,
      repositoryCount: connection.repositoriesCount,
    };
  }, [connection]);

  const error = useMemo(() => {
    if (!connection.error) return undefined;
    if (typeof connection.error === "string") {
      return new ApiError(0, connection.error);
    }
    return new ApiError(
      connection.error.status,
      connection.error.message,
      connection.error.details,
    );
  }, [connection.error]);

  return {
    status,
    error,
    isLoading: connection.isChecking,
    refresh: connection.refresh,
    connection,
  };
}

/** Repositories from the global GitHub connection cache. */
export function useRepositories(): {
  repositories: RepositorySummary[] | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  refresh: () => void;
} {
  const { connection } = useGitHubInstallation();

  const error = useMemo(() => {
    if (!connection.error) return undefined;
    if (typeof connection.error === "string") {
      return new ApiError(0, connection.error);
    }
    return new ApiError(
      connection.error.status,
      connection.error.message,
      connection.error.details,
    );
  }, [connection.error]);

  return {
    repositories: connection.initialized ? connection.repositories : undefined,
    error,
    isLoading: connection.isChecking,
    refresh: connection.refresh,
  };
}

export { useGitHubConnection } from "@/lib/store/useGitHubConnection";

// ─── Repositories (detail endpoints — still SWR) ───────────────────────────────

export function useRepository(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ["repository", id] : null,
    () => repositoriesApi.get(id as string),
    swrDefaults,
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
    swrDefaults,
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
    [filters],
  );
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => pullRequestsApi.list(filters),
    swrDefaults,
  );
  return {
    pullRequests: data as PullRequest[] | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

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
    },
  );

  const status = data?.status;
  const isTerminal = !!status && TERMINAL_PR.includes(status);

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
    swrDefaults,
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
    swrDefaults,
  );
  return {
    review: data as Review | undefined,
    error: error as ApiError | undefined,
    isLoading,
    refresh: mutate,
  };
}

// ─── Dashboard summary ─────────────────────────────────────────────────────────

export function useDashboardStats(): {
  stats: DashboardStats | undefined;
  error: ApiError | undefined;
  isLoading: boolean;
  refresh: () => void;
  connectionStatus: GitHubConnectionState["status"];
} {
  const install = useGitHubInstallation();
  const prs = usePullRequests();
  const connection = install.connection;

  const connected = connection.connected;
  const error = (install.error ?? prs.error) as ApiError | undefined;
  const isLoading =
    connection.isChecking || (connected && prs.isLoading);

  const stats = useMemo<DashboardStats | undefined>(() => {
    if (connection.isChecking) return undefined;
    const list = prs.pullRequests ?? [];
    const recent = [...list]
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
      .slice(0, 5);
    return {
      connected,
      repositoryCount: connection.repositoriesCount,
      pullRequestCount: list.length,
      reviewedCount: list.filter((p) => p.status === "REVIEWED").length,
      failedCount: list.filter((p) => p.status === "FAILED").length,
      recentPullRequests: recent,
    };
  }, [connection.isChecking, connection.repositoriesCount, connected, prs.pullRequests]);

  return {
    stats,
    error,
    isLoading,
    connectionStatus: connection.status,
    refresh: () => {
      install.refresh();
      void prs.refresh();
    },
  };
}
