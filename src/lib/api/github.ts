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
   * POST /github/installation/verify
   * Ask the backend to verify a freshly-completed installation and link it to
   * the authenticated user. GitHub redirects back with an `installation_id`
   * (and `setup_action`) which we pass through for the backend to validate.
   * The backend authenticates the session — it does NOT trust these values
   * blindly.
   */
  verifyInstallation(
    input: { installationId?: string | null; setupAction?: string | null },
    signal?: AbortSignal
  ): Promise<GitHubInstallationStatus> {
    return apiRequest<GitHubInstallationStatus>("/github/installation/verify", {
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
