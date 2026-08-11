/**
 * pull-requests.ts
 * Pull request listing and detail endpoints.
 */

import { apiRequest } from "./client";
import type { PullRequest, PullRequestFilters } from "./types";

export const pullRequestsApi = {
  /** GET /pull-requests — optionally filtered by repository, status, author, date. */
  list(filters: PullRequestFilters = {}, signal?: AbortSignal): Promise<PullRequest[]> {
    return apiRequest<PullRequest[]>("/pull-requests", {
      params: {
        repositoryId: filters.repositoryId,
        status: filters.status,
        author: filters.author,
        since: filters.since,
      },
      signal,
    });
  },

  /**
   * GET /pull-requests/:id — full detail including changed files and review.
   * This is the endpoint polled while a PR is RECEIVED/PROCESSING.
   */
  get(id: string, signal?: AbortSignal): Promise<PullRequest> {
    return apiRequest<PullRequest>(`/pull-requests/${id}`, { signal });
  },
};
