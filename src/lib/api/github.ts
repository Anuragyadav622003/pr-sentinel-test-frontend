/**
 * github.ts
 * GitHub App installation / connection endpoints.
 *
 * The frontend NEVER creates a GitHub App or handles installation tokens.
 * It only reads the connection state the backend confirms, and redirects the
 * user to the single PR Sentinel GitHub App install URL.
 */

import { apiRequest } from "./client";
import type { GitHubInstallationStatus, Repository } from "./types";

export const githubApi = {
  /**
   * GET /github/installation
   * Returns whether the authenticated user has a confirmed GitHub App
   * installation. This is the single source of truth for "connected".
   */
  getInstallation(signal?: AbortSignal): Promise<GitHubInstallationStatus> {
    return apiRequest<GitHubInstallationStatus>("/github/installation", { signal });
  },

  /**
   * GET /github/repositories
   * Repositories the installation has access to.
   */
  getRepositories(signal?: AbortSignal): Promise<Repository[]> {
    return apiRequest<Repository[]>("/github/repositories", { signal });
  },

  /**
   * POST /github/install/start
   * Returns the GitHub App install URL carrying a single-use `state` bound to
   * the authenticated user, which GitHub echoes back to the Setup URL.
   */
  startInstall(signal?: AbortSignal): Promise<{ installUrl: string }> {
    return apiRequest<{ installUrl: string }>("/github/install/start", {
      method: "POST",
      signal,
    });
  },

  /**
   * GET /github/install/complete
   * The GitHub App Setup URL redirect lands on /github/setup, which forwards
   * `installation_id` / `state` here. The backend validates the state against
   * the authenticated session, links the installation to the user and syncs
   * repositories. IDs stay strings — they are opaque to the frontend.
   */
  completeInstall(
    input: { installationId: string; state?: string | null; setupAction?: string | null },
    signal?: AbortSignal
  ): Promise<GitHubInstallationStatus> {
    return apiRequest<GitHubInstallationStatus>("/github/install/complete", {
      params: {
        installation_id: input.installationId,
        state: input.state ?? undefined,
        setup_action: input.setupAction ?? undefined,
      },
      signal,
    });
  },

  /**
   * POST /github/install/claim
   * State-free fallback for when GitHub redirects back without a state (the
   * app was already installed). Identity comes from the session cookie; the
   * backend only allows unclaimed installations or ones already owned.
   */
  verifyInstallation(
    input: { installationId?: string | null; setupAction?: string | null },
    signal?: AbortSignal
  ): Promise<GitHubInstallationStatus> {
    return apiRequest<GitHubInstallationStatus>("/github/install/claim", {
      method: "POST",
      body: {
        installationId: input.installationId ?? undefined,
        setupAction: input.setupAction ?? undefined,
      },
      signal,
    });
  },
};

/**
 * Public install URL for the one PR Sentinel GitHub App. Configured via a
 * public env var — it contains no secrets. If the backend prefers to build
 * the URL (e.g. to attach a signed `state`), it can expose it instead.
 */
export function getInstallUrl(): string | null {
  return process.env.NEXT_PUBLIC_GITHUB_APP_INSTALL_URL || null;
}
