"use client";

import { useCallback, useEffect, useMemo } from "react";
import { isAuthenticated } from "@/lib/auth";
import { getInstallUrl } from "@/lib/api/github";
import type { GitHubInstallationStatus, RepositorySummary } from "@/lib/api/types";
import { useAppDispatch, useAppSelector } from "./hooks";
import {
  useCompleteInstallMutation,
  useGetInstallationStatusQuery,
  useStartInstallMutation,
  useSyncInstallationMutation,
} from "./githubApi";
import {
  clearError,
  setConnecting,
  setError,
  setInitialized,
  setLastSyncedAt,
  setSyncing,
  type GitHubUiStatus,
} from "./githubSlice";
import type { SerializedApiError } from "./baseQuery";

export type GitHubConnectionStatus = GitHubUiStatus;

export interface GitHubConnectionState {
  /** Derived connection status for UI. */
  status: GitHubConnectionStatus;
  /** Backend-confirmed connection flag. */
  connected: boolean;
  /** Whether the first status fetch is still in flight. */
  isChecking: boolean;
  /** Any in-flight refetch (install complete, manual refresh, etc.). */
  isFetching: boolean;
  /** True once the first backend status request has settled. */
  initialized: boolean;
  installationId: string | null;
  accountLogin: string | null;
  accountAvatarUrl: string | null;
  suspended: boolean;
  installation: GitHubInstallationStatus["installation"];
  repositories: RepositorySummary[];
  repositoriesCount: number;
  lastSyncedAt: string | null;
  error: SerializedApiError | string | null;
  /** Start the GitHub App install flow (redirects to GitHub). */
  startConnect: () => Promise<void>;
  /** Re-fetch installation status from the backend. */
  refresh: () => void;
  /** Trigger a manual repository sync on the backend. */
  syncRepositories: () => Promise<void>;
  /** Clear a client-side install error. */
  dismissError: () => void;
}

function deriveStatus(
  uiStatus: GitHubUiStatus,
  connected: boolean,
  initialized: boolean,
  isChecking: boolean,
  isConnecting: boolean,
  isSyncing: boolean,
  hasQueryError: boolean,
  hasUiError: boolean,
): GitHubConnectionStatus {
  if (isConnecting) return "connecting";
  if (isSyncing) return "syncing";
  if (hasUiError || (hasQueryError && uiStatus === "error")) return "error";
  if (!initialized || isChecking) return "unknown";
  if (connected) return "connected";
  return "disconnected";
}

/**
 * Unified GitHub connection hook — single source of truth for all UI.
 * Combines RTK Query server cache with client install-flow state.
 */
export function useGitHubConnection(): GitHubConnectionState {
  const dispatch = useAppDispatch();
  const slice = useAppSelector((state) => state.github);
  const authenticated = isAuthenticated();

  const {
    data,
    error: queryError,
    isLoading,
    isFetching,
    isUninitialized,
    refetch,
  } = useGetInstallationStatusQuery(undefined, {
    skip: !authenticated,
    refetchOnMountOrArgChange: true,
  });

  const [startInstall, startInstallState] = useStartInstallMutation();
  const [syncInstallation, syncInstallationState] = useSyncInstallationMutation();

  // Mark initialized once the first fetch completes.
  useEffect(() => {
    if (!authenticated) {
      dispatch(setInitialized(true));
      return;
    }
    if (!isUninitialized && !isLoading) {
      dispatch(setInitialized(true));
    }
  }, [authenticated, dispatch, isLoading, isUninitialized]);

  const connected = !!data?.connected;
  const initialized = slice.initialized;
  const isChecking = authenticated && (!initialized || (isLoading && !data));

  const status = deriveStatus(
    slice.uiStatus,
    connected,
    initialized,
    isChecking,
    startInstallState.isLoading,
    syncInstallationState.isLoading || slice.uiStatus === "syncing",
    !!queryError,
    !!slice.error,
  );

  const startConnect = useCallback(async () => {
    if (startInstallState.isLoading) return;
    dispatch(setConnecting());
    try {
      const result = await startInstall().unwrap();
      window.location.assign(result.installUrl);
    } catch (err) {
      const fallback = getInstallUrl();
      if (fallback) {
        window.location.assign(fallback);
        return;
      }
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as SerializedApiError).message)
          : "Unable to start GitHub installation.";
      dispatch(setError(message));
    }
  }, [dispatch, startInstall, startInstallState.isLoading]);

  const syncRepositories = useCallback(async () => {
    if (syncInstallationState.isLoading) return;
    dispatch(setSyncing());
    try {
      await syncInstallation().unwrap();
      dispatch(setLastSyncedAt(new Date().toISOString()));
      await refetch();
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as SerializedApiError).message)
          : "Unable to sync repositories.";
      dispatch(setError(message));
    }
  }, [dispatch, refetch, syncInstallation, syncInstallationState.isLoading]);

  const refresh = useCallback(() => {
    if (authenticated) void refetch();
  }, [authenticated, refetch]);

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const queryErrorMessage = useMemo(() => {
    if (!queryError) return null;
    if ("status" in queryError && "message" in queryError) {
      return queryError as SerializedApiError;
    }
    return null;
  }, [queryError]);

  return useMemo(
    () => ({
      status,
      connected,
      isChecking,
      isFetching,
      initialized,
      installationId: data?.installation?.githubInstallationId ?? null,
      accountLogin: data?.installation?.accountLogin ?? null,
      accountAvatarUrl: data?.installation?.accountAvatarUrl ?? null,
      suspended: data?.installation?.suspended ?? false,
      installation: data?.installation ?? null,
      repositories: data?.repositories ?? [],
      repositoriesCount: data?.repositoryCount ?? 0,
      lastSyncedAt: slice.lastSyncedAt,
      error: slice.error ?? queryErrorMessage,
      startConnect,
      refresh,
      syncRepositories,
      dismissError,
    }),
    [
      status,
      connected,
      isChecking,
      isFetching,
      initialized,
      data,
      slice.lastSyncedAt,
      slice.error,
      queryErrorMessage,
      startConnect,
      refresh,
      syncRepositories,
      dismissError,
    ],
  );
}

/** Hook for the GitHub App install callback page. */
export function useCompleteGitHubInstall() {
  const dispatch = useAppDispatch();
  const [completeInstall, mutationState] = useCompleteInstallMutation();
  const { refetch } = useGetInstallationStatusQuery(undefined, {
    skip: !isAuthenticated(),
  });

  const complete = useCallback(
    async (params: {
      installationId: string;
      state?: string | null;
      setupAction?: string | null;
    }) => {
      dispatch(setConnecting());
      try {
        const result = await completeInstall(params).unwrap();
        dispatch(setSyncing());
        dispatch(setLastSyncedAt(new Date().toISOString()));
        await refetch();
        return result;
      } catch (err) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as SerializedApiError).message)
            : "The installation could not be verified.";
        dispatch(setError(message));
        throw err;
      }
    },
    [completeInstall, dispatch, refetch],
  );

  return {
    complete,
    isLoading: mutationState.isLoading,
    error: mutationState.error,
  };
}
