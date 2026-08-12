import type {
  GitHubInstallationStatus,
  GitHubInstallationStatusWithRepos,
  RepositorySummary,
} from "@/lib/api/types";
import { baseApi } from "./baseApi";

export interface CompleteInstallParams {
  installationId: string;
  state?: string | null;
  setupAction?: string | null;
}

function normalizeInstallationStatus(
  status: GitHubInstallationStatus,
): GitHubInstallationStatus {
  if (!status.installation) return status;
  return {
    ...status,
    installation: {
      ...status.installation,
      githubInstallationId: String(status.installation.githubInstallationId),
    },
  };
}

function normalizeStatusWithRepos(
  status: GitHubInstallationStatusWithRepos,
): GitHubInstallationStatusWithRepos {
  const normalized = normalizeInstallationStatus(status);
  return {
    ...normalized,
    repositories: status.repositories.map((repo) => ({
      ...repo,
      githubRepoId: Number(repo.githubRepoId),
    })),
  };
}

export const githubApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * Primary source of truth: installation status + active repositories.
     * GET /github/installation/status
     */
    getInstallationStatus: build.query<GitHubInstallationStatusWithRepos, void>({
      query: () => "/github/installation/status",
      transformResponse: (response: GitHubInstallationStatusWithRepos) =>
        normalizeStatusWithRepos(response),
      providesTags: (result) =>
        result
          ? [
              { type: "GitHubInstallation", id: "STATUS" },
              { type: "GitHubRepositories", id: "LIST" },
            ]
          : [
              { type: "GitHubInstallation", id: "STATUS" },
              { type: "GitHubRepositories", id: "LIST" },
            ],
    }),

    /** Lightweight install check without repository payload. */
    getInstallation: build.query<GitHubInstallationStatus, void>({
      query: () => "/github/installation",
      transformResponse: (response: GitHubInstallationStatus) =>
        normalizeInstallationStatus(response),
      providesTags: [{ type: "GitHubInstallation", id: "STATUS" }],
    }),

    startInstall: build.mutation<{ installUrl: string }, void>({
      query: () => ({
        url: "/github/install/start",
        method: "POST",
      }),
    }),

    completeInstall: build.mutation<
      GitHubInstallationStatus,
      CompleteInstallParams
    >({
      query: ({ installationId, state, setupAction }) => {
        const params = new URLSearchParams();
        params.set("installation_id", installationId);
        if (state) params.set("state", state);
        if (setupAction) params.set("setup_action", setupAction);
        return `/github/install/complete?${params.toString()}`;
      },
      transformResponse: (response: GitHubInstallationStatus) =>
        normalizeInstallationStatus(response),
      invalidatesTags: [
        { type: "GitHubInstallation", id: "STATUS" },
        { type: "GitHubRepositories", id: "LIST" },
      ],
    }),

    syncInstallation: build.mutation<
      { synced: number; deactivated: number; repositories: RepositorySummary[] },
      void
    >({
      query: () => ({
        url: "/github/installation/sync",
        method: "POST",
      }),
      invalidatesTags: [
        { type: "GitHubInstallation", id: "STATUS" },
        { type: "GitHubRepositories", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetInstallationStatusQuery,
  useGetInstallationQuery,
  useStartInstallMutation,
  useCompleteInstallMutation,
  useSyncInstallationMutation,
} = githubApi;
