/**
 * repositories.ts
 * Repository listing and detail endpoints.
 */

import { apiRequest } from "./client";
import type { PullRequest, Repository } from "./types";

export const repositoriesApi = {
  /** GET /repositories — all repositories connected to the user's installation. */
  list(signal?: AbortSignal): Promise<Repository[]> {
    return apiRequest<Repository[]>("/repositories", { signal });
  },

  /** GET /repositories/:id — a single repository with aggregate counts. */
  get(id: string, signal?: AbortSignal): Promise<Repository> {
    return apiRequest<Repository>(`/repositories/${id}`, { signal });
  },

  /** GET /repositories/:id/pull-requests — pull requests for one repository. */
  pullRequests(id: string, signal?: AbortSignal): Promise<PullRequest[]> {
    return apiRequest<PullRequest[]>(`/repositories/${id}/pull-requests`, { signal });
  },
};
