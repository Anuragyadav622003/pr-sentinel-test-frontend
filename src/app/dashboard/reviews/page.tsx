"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { useReviews } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";
import type { Review, ReviewStatus } from "@/lib/api/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ReviewStatus) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="status-badge success">
          <CheckCircle2 size={10} />
          Completed
        </span>
      );
    case "PENDING":
      return (
        <span className="status-badge info">
          <Clock size={10} />
          Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="status-badge danger">
          <XCircle size={10} />
          Failed
        </span>
      );
  }
}

function severityDot(sev: string) {
  const colors: Record<string, string> = {
    CRITICAL: "var(--danger)",
    HIGH: "var(--danger)",
    MEDIUM: "var(--warning)",
    LOW: "var(--muted)",
  };
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: colors[sev] ?? "var(--muted)",
        flexShrink: 0,
      }}
    />
  );
}

function countsBySeverity(review: Review) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const c of review.comments ?? []) {
    counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }
  return counts;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td><span className="skeleton" style={{ display: "block", height: 14, width: "70%", borderRadius: 4 }} /></td>
          <td><span className="skeleton" style={{ display: "block", height: 14, width: 80, borderRadius: 4 }} /></td>
          <td><span className="skeleton" style={{ display: "block", height: 14, width: 60, borderRadius: 4 }} /></td>
          <td><span className="skeleton" style={{ display: "block", height: 14, width: 50, borderRadius: 4 }} /></td>
          <td><span className="skeleton" style={{ display: "block", height: 14, width: 40, borderRadius: 4 }} /></td>
        </tr>
      ))}
    </>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyReviews({ connected }: { connected: boolean }) {
  const router = useRouter();
  return (
    <div className="workspace-empty" style={{ padding: "56px 24px" }}>
      <div className="empty-icon">
        <ShieldCheck size={18} />
      </div>
      <h2>No reviews yet</h2>
      <p>
        {connected
          ? "Reviews appear here once a pull request triggers the AI analysis pipeline. Open a PR on a connected repository to get started."
          : "Connect a GitHub repository and open a pull request to start receiving AI-powered reviews."}
      </p>
      {!connected && (
        <button
          className="primary-button"
          onClick={() => router.push("/dashboard/github")}
        >
          Connect GitHub <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Stats row ────────────────────────────────────────────────────────────────

function StatsRow({ reviews }: { reviews: Review[] }) {
  const completed = reviews.filter((r) => r.status === "COMPLETED").length;
  const failed = reviews.filter((r) => r.status === "FAILED").length;
  const totalComments = reviews.reduce((n, r) => n + (r.comments?.length ?? 0), 0);
  const criticalCount = reviews.reduce(
    (n, r) => n + (r.comments?.filter((c) => c.severity === "CRITICAL").length ?? 0),
    0,
  );
  const highCount = reviews.reduce(
    (n, r) => n + (r.comments?.filter((c) => c.severity === "HIGH").length ?? 0),
    0,
  );

  return (
    <div className="stats-grid cols-4" style={{ marginBottom: 22 }}>
      <div className="stat-card">
        <div className="stat-head">
          <span>Total reviews</span>
          <ShieldCheck size={13} />
        </div>
        <div className="stat-value">{reviews.length}</div>
        <div className="stat-foot" style={{ display: "flex", gap: 8 }}>
          <span style={{ color: "var(--success)" }}>{completed} completed</span>
          {failed > 0 && <span style={{ color: "var(--danger)" }}>{failed} failed</span>}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-head">
          <span>Success rate</span>
          <CheckCircle2 size={13} />
        </div>
        <div className="stat-value" style={{ color: "var(--success)" }}>
          {reviews.length > 0 ? `${Math.round((completed / reviews.length) * 100)}%` : "—"}
        </div>
        <div className="stat-foot">of reviews completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-head">
          <span>Total findings</span>
          <AlertTriangle size={13} />
        </div>
        <div className="stat-value">{totalComments}</div>
        <div className="stat-foot" style={{ display: "flex", gap: 8 }}>
          {criticalCount > 0 && (
            <span style={{ color: "var(--danger)", fontWeight: 600 }}>{criticalCount} critical</span>
          )}
          {highCount > 0 && (
            <span style={{ color: "var(--danger)" }}>{highCount} high</span>
          )}
          {criticalCount === 0 && highCount === 0 && (
            <span>no critical issues</span>
          )}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-head">
          <span>Need attention</span>
          <XCircle size={13} />
        </div>
        <div className="stat-value" style={{ color: failed > 0 ? "var(--danger)" : "var(--muted)" }}>
          {failed}
        </div>
        <div className="stat-foot">failed reviews to retry</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const router = useRouter();
  const { reviews, isLoading, error, refresh } = useReviews();
  const github = useGitHubConnection();
  const connected = github.connected;

  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = (reviews ?? []).filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.provider?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardShell title="Reviews" eyebrow="REVIEWS">
      {/* Page header */}
      <div className="data-header" style={{ marginBottom: 24 }}>
        <div>
          <h1>Reviews</h1>
          <p>AI-powered pull request reviews generated by PR Sentinel.</p>
        </div>
        <div className="header-actions">
          <button
            className="secondary-button"
            onClick={() => refresh()}
            disabled={isLoading}
            aria-label="Refresh reviews"
          >
            <RefreshCw size={14} className={isLoading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats — only when there's data */}
      {!isLoading && !error && (reviews?.length ?? 0) > 0 && (
        <StatsRow reviews={reviews!} />
      )}

      {/* Skeleton stats */}
      {isLoading && (
        <div className="stats-grid cols-4" style={{ marginBottom: 22 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="stat-card" key={i}>
              <span className="skeleton" style={{ display: "block", height: 12, width: "60%", borderRadius: 4 }} />
              <span className="skeleton" style={{ display: "block", height: 32, width: "40%", borderRadius: 4, marginTop: 12 }} />
              <span className="skeleton" style={{ display: "block", height: 10, width: "50%", borderRadius: 4, marginTop: 8 }} />
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          className="filter-input"
          type="search"
          placeholder="Search reviews…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search reviews"
        />
        <div className="filter-select">
          <ShieldCheck size={13} style={{ color: "var(--muted)" }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | "ALL")}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        {!isLoading && (
          <span className="results-count">
            {filtered.length} {filtered.length === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="workspace-panel" style={{ borderColor: "#ed879555" }}>
          <div className="workspace-empty error" style={{ padding: "40px 24px" }}>
            <div className="empty-icon danger">
              <AlertTriangle size={18} />
            </div>
            <h2>Failed to load reviews</h2>
            <p>{error.message}</p>
            <button className="primary-button" onClick={() => refresh()}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="data-table-wrap">
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Review</th>
                  <th>Pull request</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 0, border: 0 }}>
                      <EmptyReviews connected={connected} />
                    </td>
                  </tr>
                ) : (
                  filtered.map((review) => {
                    const counts = countsBySeverity(review);
                    const totalFindings = (review.comments?.length ?? 0);
                    return (
                      <tr
                        key={review.id}
                        className="clickable"
                        tabIndex={0}
                        onClick={() => router.push(`/dashboard/reviews/${review.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            router.push(`/dashboard/reviews/${review.id}`);
                          }
                        }}
                      >
                        {/* Review ID + provider */}
                        <td>
                          <div className="cell-pr">
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <Sparkles size={13} style={{ color: "var(--accent)", flexShrink: 0 }} />
                              <strong style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                                {review.id.slice(0, 8)}
                              </strong>
                            </div>
                            <small>{review.provider ?? "AI"}</small>
                          </div>
                        </td>

                        {/* PR link */}
                        <td>
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", fontSize: 11 }}
                          >
                            <GitPullRequest size={12} />
                            <span
                              style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                            >
                              {review.pullRequestId.slice(0, 8)}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>{statusBadge(review.status)}</td>

                        {/* Findings */}
                        <td>
                          {totalFindings === 0 ? (
                            <span style={{ color: "var(--muted)", fontSize: 11 }}>—</span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((sev) =>
                                counts[sev] > 0 ? (
                                  <span
                                    key={sev}
                                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--muted)" }}
                                  >
                                    {severityDot(sev)}
                                    {counts[sev]} {sev.charAt(0) + sev.slice(1).toLowerCase()}
                                  </span>
                                ) : null
                              )}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ color: "var(--muted)", fontSize: 11, whiteSpace: "nowrap" }}>
                          {formatDate(review.createdAt)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
