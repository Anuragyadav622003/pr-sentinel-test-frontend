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
  githubInstallationId: number;
  userId: string;
  /** GitHub account / organization login the app was installed on. */
  accountLogin?: string | null;
  accountAvatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
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

// ─── Dashboard summary ─────────────────────────────────────────────────────────

export interface DashboardStats {
  connected: boolean;
  repositoryCount: number;
  pullRequestCount: number;
  reviewedCount: number;
  failedCount: number;
  recentPullRequests: PullRequest[];
}

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface PullRequestFilters {
  repositoryId?: string;
  status?: PullRequestStatus;
  author?: string;
  /** ISO date string — PRs created on/after this date. */
  since?: string;
}
