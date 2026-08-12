/**
 * reviews.ts
 * AI review endpoints.
 */

import { apiRequest } from "./client";
import type { ChatRequest, ChatResponse, Review } from "./types";

export const reviewsApi = {
  /** GET /reviews — all reviews for the authenticated user. */
  list(signal?: AbortSignal): Promise<Review[]> {
    return apiRequest<Review[]>("/reviews", { signal });
  },

  /** GET /reviews/:id — a single review including its comments. */
  get(id: string, signal?: AbortSignal): Promise<Review> {
    return apiRequest<Review>(`/reviews/${id}`, { signal });
  },

  /** GET /reviews/pull-request/:pullRequestId — the review for a given PR. */
  getByPullRequest(pullRequestId: string, signal?: AbortSignal): Promise<Review | null> {
    return apiRequest<Review | null>(`/reviews/pull-request/${pullRequestId}`, { signal });
  },

  /**
   * POST /reviews/:id/retry — re-queue a FAILED review.
   * Idempotency key prevents a retry click from enqueuing duplicate jobs.
   */
  retry(id: string, signal?: AbortSignal): Promise<Review> {
    return apiRequest<Review>(`/reviews/${id}/retry`, {
      method: "POST",
      idempotencyKey: `retry-review-${id}`,
      signal,
    });
  },

  /**
   * POST /reviews/:id/chat
   * Send a message about this review and receive an AI reply.
   * Pass `conversationId` after the first turn to maintain history.
   */
  chat(id: string, req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    return apiRequest<ChatResponse>(`/reviews/${id}/chat`, {
      method: "POST",
      body: req,
      signal,
    });
  },
};
