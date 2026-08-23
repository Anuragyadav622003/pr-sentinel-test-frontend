/**
 * llm.ts
 * API wrappers for the LLM configuration and quota endpoints.
 * All routes require an authenticated session (HttpOnly cookie).
 */

import { apiRequest } from "./client";
import type { LlmConfig, LlmMode, LlmModeStatus, LlmProvider } from "./types";

export const llmApi = {
  // ─── Config (BYOK keys) ────────────────────────────────────────────────────

  /** GET /llm/config — list all saved provider configs (no API keys returned). */
  listConfigs(signal?: AbortSignal): Promise<LlmConfig[]> {
    return apiRequest<LlmConfig[]>("/llm/config", { signal });
  },

  /**
   * POST /llm/config — create or update a BYOK provider config.
   * The API key is encrypted server-side and never returned.
   */
  upsertConfig(
    provider: LlmProvider,
    apiKey: string,
    model: string,
    signal?: AbortSignal,
  ): Promise<LlmConfig> {
    return apiRequest<LlmConfig>("/llm/config", {
      method: "POST",
      body: { provider, apiKey, model },
      signal,
    });
  },

  /** DELETE /llm/config/:provider — remove a saved provider config. */
  removeConfig(provider: LlmProvider, signal?: AbortSignal): Promise<void> {
    return apiRequest<void>(`/llm/config/${provider}`, {
      method: "DELETE",
      signal,
    });
  },

  // ─── Mode ──────────────────────────────────────────────────────────────────

  /**
   * GET /llm/mode — current llmMode + remaining free quota.
   * remainingFree is only present when mode === "FREE".
   */
  getMode(signal?: AbortSignal): Promise<LlmModeStatus> {
    return apiRequest<LlmModeStatus>("/llm/mode", { signal });
  },

  /** PATCH /llm/mode — switch between FREE and BYOK. */
  updateMode(llmMode: LlmMode, signal?: AbortSignal): Promise<{ llmMode: LlmMode }> {
    return apiRequest<{ llmMode: LlmMode }>("/llm/mode", {
      method: "PATCH",
      body: { llmMode },
      signal,
    });
  },
};
