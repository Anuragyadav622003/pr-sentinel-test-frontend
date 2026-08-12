"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  GitPullRequest,
  MapPin,
  MessageSquare,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { AiReviewChat } from "@/components/ai-review-chat";
import { useReview } from "@/lib/api/hooks";
import { reviewsApi } from "@/lib/api/reviews";
import { useState } from "react";
import type { ReviewComment, ReviewStatus, Severity } from "@/lib/api/types";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = "overview" | "findings" | "files" | "chat";

// ─── Severity helpers ─────────────────────────────────────────────────────────

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, string> = {
    CRITICAL: "critical",
    HIGH: "danger",
    MEDIUM: "warning",
    LOW: "neutral",
  };
  return <span className={`severity-badge ${map[severity]}`}>{severity}</span>;
}

function severityCardClass(severity: Severity) {
  const map: Record<Severity, string> = {
    CRITICAL: "sev-critical",
    HIGH: "sev-high",
    MEDIUM: "sev-medium",
    LOW: "sev-low",
  };
  return map[severity];
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReviewStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="status-badge success">
          <CheckCircle2 size={10} /> Completed
        </span>
      );
    case "PENDING":
      return (
        <span className="status-badge info">
          <Clock size={10} /> Pending
        </span>
      );
    case "FAILED":
      return (
        <span className="status-badge danger">
          <XCircle size={10} /> Failed
        </span>
      );
  }
}

// ─── Finding counts grid ──────────────────────────────────────────────────────

function FindingCounts({ comments }: { comments: ReviewComment[] }) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const c of comments) {
    counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }
  const labels: Record<string, string> = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
  };
  const cls: Record<string, string> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  return (
    <div className="findings-counts">
      {SEV_ORDER.map((sev) => (
        <div key={sev} className={`finding-count ${cls[sev]}`}>
          <strong>{counts[sev]}</strong>
          <span>{labels[sev]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Comment card ─────────────────────────────────────────────────────────────

function CommentCard({ comment }: { comment: ReviewComment }) {
  return (
    <div className={`comment-card ${severityCardClass(comment.severity)}`}>
      <div className="comment-top">
        <SeverityBadge severity={comment.severity} />
        <span className="comment-cat">{comment.category}</span>
        {comment.postedToGithub && (
          <span className="posted-badge success" style={{ marginLeft: "auto" }}>
            <CheckCircle2 size={11} /> Posted to GitHub
          </span>
        )}
      </div>

      {(comment.filePath || comment.lineNumber != null) && (
        <div className="comment-loc">
          <MapPin size={11} />
          <code>{comment.filePath}</code>
          {comment.lineNumber != null && (
            <span style={{ color: "var(--muted)" }}>line {comment.lineNumber}</span>
          )}
        </div>
      )}

      <p className="comment-msg">{comment.message}</p>

      {comment.suggestion && (
        <div className="comment-suggestion">
          <span>Suggestion</span>
          {comment.suggestion}
        </div>
      )}

      <div className="comment-foot">
        <span style={{ color: "var(--muted)", fontSize: 10 }}>
          {new Date(comment.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ─── Sidebar meta ─────────────────────────────────────────────────────────────

function ReviewSidebar({
  reviewId,
  pullRequestId,
  provider,
  status,
  createdAt,
  updatedAt,
  commentCount,
  onRetry,
  retrying,
  onOpenChat,
}: {
  reviewId: string;
  pullRequestId: string;
  provider: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  onRetry: () => void;
  retrying: boolean;
  onOpenChat: () => void;
}) {
  return (
    <aside className="review-sidebar">
      {/* Status card */}
      <div className="detail-card">
        <h2>Review status</h2>
        <p className="card-sub">Current pipeline state</p>
        <StatusBadge status={status} />

        {status === "FAILED" && (
          <button
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            onClick={onRetry}
            disabled={retrying}
          >
            <RefreshCw size={14} className={retrying ? "spin" : ""} />
            {retrying ? "Retrying…" : "Retry review"}
          </button>
        )}
      </div>

      {/* AI Chat shortcut */}
      <div className="detail-card" style={{ borderColor: "#61d8c733", background: "linear-gradient(115deg, #11252a, #111925 70%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 28,
              height: 28,
              borderRadius: 7,
              color: "var(--accent)",
              background: "#61d8c71f",
            }}
          >
            <MessageSquare size={13} />
          </span>
          <h2 style={{ margin: 0, fontSize: 13 }}>AI Chat</h2>
        </div>
        <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 11, lineHeight: 1.5 }}>
          Ask questions about the PR, findings, or get suggestions for fixes.
        </p>
        <button
          className="primary-button"
          style={{ width: "100%", justifyContent: "center", fontSize: 11 }}
          onClick={onOpenChat}
        >
          <Sparkles size={13} />
          Open AI Chat
        </button>
      </div>

      {/* Meta card */}
      <div className="detail-card">
        <h2>Details</h2>
        <p className="card-sub">Review metadata</p>
        <div className="meta-list" style={{ marginTop: 14 }}>
          <div className="meta-item">
            <span>Review ID</span>
            <strong style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              {reviewId.slice(0, 12)}…
            </strong>
          </div>
          <div className="meta-item">
            <span>Provider</span>
            <strong>{provider ?? "AI"}</strong>
          </div>
          <div className="meta-item">
            <span>Findings</span>
            <strong>{commentCount}</strong>
          </div>
          <div className="meta-item">
            <span>Created</span>
            <strong>
              {new Date(createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>
          <div className="meta-item">
            <span>Updated</span>
            <strong>
              {new Date(updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </strong>
          </div>
        </div>
      </div>

      {/* PR link card */}
      <div className="detail-card">
        <h2>Pull request</h2>
        <p className="card-sub">Source of this review</p>
        <Link
          href={`/dashboard/pull-requests/${pullRequestId}`}
          className="secondary-button"
          style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
        >
          <GitPullRequest size={14} />
          View pull request
        </Link>
      </div>
    </aside>
  );
}

// ─── Overview tab content ─────────────────────────────────────────────────────

function OverviewTab({
  review,
  retryError,
}: {
  review: NonNullable<ReturnType<typeof useReview>["review"]>;
  retryError: string | null;
}) {
  const commentCount = review.comments?.length ?? 0;
  return (
    <div>
      {retryError && (
        <div className="inline-notice" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          {retryError}
        </div>
      )}
      {review.status === "FAILED" && review.errorMessage && (
        <div className="inline-notice" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            <strong>Review failed:</strong> {review.errorMessage}
          </span>
        </div>
      )}

      {/* AI Summary */}
      <div
        className="detail-card"
        style={{
          borderColor: "#61d8c733",
          background: "linear-gradient(115deg, #11252a, #111925 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: 8,
              color: "var(--accent)",
              background: "#61d8c71f",
            }}
          >
            <Sparkles size={15} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 14 }}>AI Summary</h2>
            <p className="card-sub" style={{ margin: 0 }}>
              Generated by {review.provider ?? "AI"}
            </p>
          </div>
        </div>
        {review.summary ? (
          <p className="review-summary" style={{ marginTop: 16 }}>
            {review.summary}
          </p>
        ) : (
          <p style={{ marginTop: 16, color: "var(--muted)", fontSize: 13 }}>
            {review.status === "PENDING"
              ? "Analysis in progress — summary will appear here once the review completes."
              : "No summary available for this review."}
          </p>
        )}
        {commentCount > 0 && <FindingCounts comments={review.comments!} />}
      </div>

      {/* Top findings preview (up to 3) */}
      {commentCount > 0 && (
        <>
          <div
            style={{ margin: "24px 0 14px", display: "flex", alignItems: "center", gap: 8 }}
          >
            <h2 style={{ fontSize: 14, margin: 0 }}>Top findings</h2>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--surface-raised)",
                color: "var(--muted)",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
              }}
            >
              showing {Math.min(3, commentCount)} of {commentCount}
            </span>
          </div>
          {[...review.comments!]
            .sort(
              (a, b) =>
                SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
            )
            .slice(0, 3)
            .map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
        </>
      )}
    </div>
  );
}

// ─── Findings tab content ─────────────────────────────────────────────────────

function FindingsTab({
  review,
}: {
  review: NonNullable<ReturnType<typeof useReview>["review"]>;
}) {
  const commentCount = review.comments?.length ?? 0;

  // Group comments by file
  const byFile = new Map<string, ReviewComment[]>();
  for (const c of review.comments ?? []) {
    const key = c.filePath || "(unknown file)";
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(c);
  }
  for (const [, arr] of byFile) {
    arr.sort(
      (a, b) =>
        SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity) ||
        (a.lineNumber ?? 0) - (b.lineNumber ?? 0)
    );
  }

  if (commentCount === 0) {
    if (review.status === "COMPLETED") {
      return (
        <div className="detail-card">
          <div className="workspace-empty" style={{ padding: "32px 16px" }}>
            <div className="empty-icon">
              <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
            </div>
            <h2 style={{ color: "var(--success)" }}>No findings</h2>
            <p>This review completed without any issues to report.</p>
          </div>
        </div>
      );
    }
    if (review.status === "PENDING") {
      return (
        <div className="detail-card">
          <div className="workspace-empty" style={{ padding: "32px 16px" }}>
            <div className="empty-icon">
              <Clock size={16} style={{ color: "var(--accent)" }} />
            </div>
            <h2>Analysis in progress</h2>
            <p>Findings will appear here once the AI review completes.</p>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {Array.from(byFile.entries()).map(([file, comments]) => (
        <div key={file} style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderBottom: "none",
              borderRadius: "8px 8px 0 0",
              background: "var(--surface-raised)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            <Code2 size={13} />
            <span style={{ color: "var(--foreground)" }}>{file}</span>
            <span
              style={{
                marginLeft: "auto",
                padding: "1px 6px",
                borderRadius: 3,
                background: "var(--border)",
                fontSize: 9,
              }}
            >
              {comments.length} finding{comments.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "0 0 8px 8px",
              overflow: "hidden",
            }}
          >
            {comments.map((c, i) => (
              <div
                key={c.id}
                style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
              >
                <CommentCard comment={c} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

// ─── Changed files tab ────────────────────────────────────────────────────────

function ChangedFilesTab({
  review,
}: {
  review: NonNullable<ReturnType<typeof useReview>["review"]> & {
    pullRequest?: { files?: Array<{ id: string; filename: string; status: string; additions: number; deletions: number }> };
  };
}) {
  const files = review.pullRequest?.files ?? [];

  if (files.length === 0) {
    return (
      <div className="detail-card">
        <div className="workspace-empty" style={{ padding: "32px 16px" }}>
          <div className="empty-icon">
            <Code2 size={16} />
          </div>
          <h2>No file data</h2>
          <p>Changed files are not embedded in this review response.</p>
        </div>
      </div>
    );
  }

  const totalAdd = files.reduce((s, f) => s + f.additions, 0);
  const totalDel = files.reduce((s, f) => s + f.deletions, 0);

  return (
    <div className="detail-card">
      <div className="file-list">
        {files.map((f) => (
          <div key={f.id} className="file-row">
            <span className={`file-badge ${f.status.toLowerCase()}`}>{f.status}</span>
            <span className="file-name">{f.filename}</span>
            <span className="file-stats">
              <span className="add">+{f.additions}</span>
              <span className="del">-{f.deletions}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="files-total">
        <span style={{ color: "var(--muted)", fontSize: 11 }}>
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
        <span className="add" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
          +{totalAdd}
        </span>
        <span className="del" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
          -{totalDel}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { review, isLoading, error, refresh } = useReview(id);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  async function handleRetry() {
    if (!id) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await reviewsApi.retry(id);
      await refresh();
    } catch (e: unknown) {
      setRetryError(
        e instanceof Error ? e.message : "Retry failed. Please try again."
      );
    } finally {
      setRetrying(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <DashboardShell title="Review" eyebrow="REVIEWS">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <button
            className="back-button"
            onClick={() => router.push("/dashboard/reviews")}
            style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", background: "none", border: 0, fontSize: 12 }}
          >
            <ArrowLeft size={15} /> Reviews
          </button>
        </div>
        <div className="detail-grid">
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="detail-card" style={{ marginBottom: 16 }}>
                <span className="skeleton" style={{ display: "block", height: 14, width: "40%", borderRadius: 4 }} />
                <span className="skeleton" style={{ display: "block", height: 80, width: "100%", borderRadius: 4, marginTop: 12 }} />
              </div>
            ))}
          </div>
          <aside className="review-sidebar">
            <div className="detail-card">
              <span className="skeleton" style={{ display: "block", height: 14, width: "60%", borderRadius: 4 }} />
              <span className="skeleton" style={{ display: "block", height: 60, width: "100%", borderRadius: 4, marginTop: 12 }} />
            </div>
          </aside>
        </div>
      </DashboardShell>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !review) {
    return (
      <DashboardShell title="Review" eyebrow="REVIEWS">
        <button
          className="back-button"
          onClick={() => router.push("/dashboard/reviews")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", background: "none", border: 0, fontSize: 12, marginBottom: 24 }}
        >
          <ArrowLeft size={15} /> Reviews
        </button>
        <div className="workspace-panel" style={{ borderColor: "#ed879555" }}>
          <div className="workspace-empty error" style={{ padding: "56px 24px" }}>
            <div className="empty-icon danger">
              <AlertTriangle size={20} />
            </div>
            <h2>{error?.isNotFound ? "Review not found" : "Failed to load review"}</h2>
            <p>
              {error?.isNotFound
                ? `Review ${id} does not exist or you don't have access to it.`
                : (error?.message ?? "An unexpected error occurred.")}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="secondary-button"
                onClick={() => router.push("/dashboard/reviews")}
              >
                <ArrowLeft size={14} /> Back to reviews
              </button>
              {!error?.isNotFound && (
                <button className="primary-button" onClick={() => refresh()}>
                  <RefreshCw size={14} /> Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  const commentCount = review.comments?.length ?? 0;

  return (
    <DashboardShell title="Review" eyebrow="REVIEWS">
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 22 }}>
        <button
          className="back-button"
          onClick={() => router.push("/dashboard/reviews")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--muted)", background: "none", border: 0, fontSize: 12, padding: 0 }}
        >
          <ArrowLeft size={15} /> Reviews
        </button>
        <span style={{ color: "var(--border)" }}>/</span>
        <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}>
          {review.id.slice(0, 8)}
        </span>
      </div>

      {/* Title row */}
      <div className="detail-title-row" style={{ marginBottom: 24 }}>
        <div>
          <p className="detail-kicker">
            <Sparkles size={11} style={{ display: "inline", marginRight: 4 }} />
            AI Code Review
          </p>
          <h1 style={{ marginTop: 8 }}>Review {review.id.slice(0, 8)}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <StatusBadge status={review.status} />
            <span style={{ color: "var(--muted)", fontSize: 11 }}>
              {review.provider ?? "AI provider"} ·{" "}
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="secondary-button" onClick={() => refresh()} aria-label="Refresh">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left: tabs + content */}
        <div>
          {/* Tabs */}
          <nav className="review-detail-tabs" aria-label="Review sections">
            <button
              className={`review-detail-tab${activeTab === "overview" ? " active" : ""}`}
              onClick={() => setActiveTab("overview")}
              aria-current={activeTab === "overview" ? "page" : undefined}
            >
              <Sparkles size={13} />
              Overview
            </button>
            <button
              className={`review-detail-tab${activeTab === "findings" ? " active" : ""}`}
              onClick={() => setActiveTab("findings")}
              aria-current={activeTab === "findings" ? "page" : undefined}
            >
              Findings
              {commentCount > 0 && (
                <span className="tab-count">{commentCount}</span>
              )}
            </button>
            <button
              className={`review-detail-tab${activeTab === "files" ? " active" : ""}`}
              onClick={() => setActiveTab("files")}
              aria-current={activeTab === "files" ? "page" : undefined}
            >
              <Code2 size={13} />
              Changed Files
            </button>
            <button
              className={`review-detail-tab${activeTab === "chat" ? " active" : ""}`}
              onClick={() => setActiveTab("chat")}
              aria-current={activeTab === "chat" ? "page" : undefined}
            >
              <MessageSquare size={13} />
              AI Chat
            </button>
          </nav>

          {/* Tab panels */}
          {activeTab === "overview" && (
            <OverviewTab review={review} retryError={retryError} />
          )}
          {activeTab === "findings" && <FindingsTab review={review} />}
          {activeTab === "files" && (
            <ChangedFilesTab review={review as Parameters<typeof ChangedFilesTab>[0]["review"]} />
          )}
          {activeTab === "chat" && <AiReviewChat review={review} />}
        </div>

        {/* Sidebar */}
        <ReviewSidebar
          reviewId={review.id}
          pullRequestId={review.pullRequestId}
          provider={review.provider}
          status={review.status}
          createdAt={review.createdAt}
          updatedAt={review.updatedAt}
          commentCount={commentCount}
          onRetry={handleRetry}
          retrying={retrying}
          onOpenChat={() => setActiveTab("chat")}
        />
      </div>
    </DashboardShell>
  );
}
