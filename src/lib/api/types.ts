/**
 * types.ts
 * TypeScript representations of the backend (PostgreSQL + Prisma) data model.
 * These mirror the entities described in the PR Sentinel backend contract.
 * The frontend only ever receives persisted metadata — never source code,
 * diffs, tokens or secrets.
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type PullRequestStatus = "RECEIVED" | "PROCESSING" | "REVIEWED" | "FAILED";

export type ReviewStatus = "PENDING" | "COMPLETED" | "FAILED";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type PrFileStatus = "added" | "modified" | "removed" | "renamed";

/** GitHub installation connection state as understood by the frontend. */
export type InstallationState =
  | "NOT_CONNECTED"
  | "INSTALLING"
  | "CONNECTED"
  | "ERROR";

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Installation {
  id: string;
  /** Stored as string — GitHub IDs can exceed 32-bit integer range. */
  githubInstallationId: string;
  userId: string | null;
  accountLogin?: string | null;
  accountAvatarUrl?: string | null;
  suspended?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Repository summary returned by GET /github/installation/status. */
export interface RepositorySummary {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isActive: boolean;
  htmlUrl: string | null;
}

export interface Repository {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isActive: boolean;
  installationId: string;
  /** Optional aggregate counts the backend may include for list/detail views. */
  pullRequestCount?: number;
  reviewCount?: number;
  htmlUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrFile {
  id: string;
  filename: string;
  status: PrFileStatus;
  additions: number;
  deletions: number;
  changes: number;
  pullRequestId: string;
  createdAt: string;
  /** Present when fetched via GET /pull-requests/:id/files/:fileId */
  patch?: string | null;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  lineNumber: number | null;
  severity: Severity;
  category: string;
  message: string;
  /** Optional remediation guidance the AI may provide. */
  suggestion?: string | null;
  postedToGithub: boolean;
  githubCommentId: string | null;
  reviewId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  provider: string;
  summary: string | null;
  status: ReviewStatus;
  errorMessage: string | null;
  pullRequestId: string;
  comments?: ReviewComment[];
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: string;
  githubPrId: number;
  githubPrNumber: number;
  title: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  status: PullRequestStatus;
  errorMessage: string | null;
  lastDeliveryId: string | null;
  repositoryId: string;
  /** Convenience relations the backend may embed. */
  repository?: Pick<Repository, "id" | "owner" | "name" | "fullName">;
  htmlUrl?: string | null;
  files?: PrFile[];
  review?: Review | null;
  createdAt: string;
  updatedAt: string;
}

// ─── GitHub connection status ─────────────────────────────────────────────────

/**
 * Response shape for GET /github/installation.
 * `connected` is the single source of truth — the frontend must never show
 * a connected state unless the backend confirms it here.
 */
export interface GitHubInstallationStatus {
  connected: boolean;
  installation: Installation | null;
  repositoryCount: number;
}

/** GET /github/installation/status — installation + active repositories. */
export interface GitHubInstallationStatusWithRepos extends GitHubInstallationStatus {
  repositories: RepositorySummary[];
}

// ─── Dashboard summary ─────────────────────────────────────────────────────────

export interface DashboardStats {
  connected: boolean;
  repositoryCount: number;
  pullRequestCount: number;
  reviewedCount: number;
  failedCount: number;
  recentPullRequests: PullRequest[];
}

// ─── AI Review Chat ───────────────────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  /** Omit on the first turn; echo back the returned id on subsequent turns. */
  conversationId?: string;
}

export interface ChatResponse {
  message: string;
  conversationId: string;
}

/** A single bubble rendered inside the chat UI (client-side only). */
export interface ChatBubble {
  role: "user" | "assistant";
  content: string;
}

// ─── LLM / AI model types ─────────────────────────────────────────────────────

export type LlmMode = "FREE" | "BYOK";

export type LlmProvider = "OPENROUTER" | "OPENAI" | "GEMINI" | "ANTHROPIC";

/** A single BYOK provider config returned by GET /llm/config */
export interface LlmConfig {
  id: string;
  provider: LlmProvider;
  model: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** apiKey is never returned by the backend — stored encrypted server-side */
}

/** Response shape for GET /llm/mode */
export interface LlmModeStatus {
  llmMode: LlmMode;
  /** Only present when llmMode === "FREE" */
  remainingFree?: number;
}



export interface PullRequestFilters {
  repositoryId?: string;
  status?: PullRequestStatus;
  author?: string;
  /** ISO date string — PRs created on/after this date. */
  since?: string;
}
