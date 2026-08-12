"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Code2,
  GitPullRequest,
  Loader2,
  MapPin,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { AiReviewChat } from "@/components/ai-review-chat";
import { DiffViewer } from "@/components/diff-viewer";
import { PrStatusBadge } from "@/components/ui/badges";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useLivePullRequest } from "@/lib/api/hooks";
import { pullRequestsApi } from "@/lib/api/pull-requests";
import { reviewsApi } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import { useGitHubConnection } from "@/lib/store";
import type {
  PrFile,
  PullRequest,
  Review,
  ReviewComment,
  ReviewStatus,
  Severity,
} from "@/lib/api/types";

type Tab = "overview" | "diff" | "findings" | "chat";

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

function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
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

function FindingCounts({ comments }: { comments: ReviewComment[] }) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const c of comments) {
    if (c.severity) counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }
  const cls: Record<string, string> = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
  };
  const labels: Record<string, string> = {
    CRITICAL: "Critical",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
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

function CommentCard({
  comment,
  onJump,
}: {
  comment: ReviewComment;
  onJump?: () => void;
}) {
  const sevClass =
    comment.severity === "CRITICAL"
      ? "sev-critical"
      : comment.severity === "HIGH"
        ? "sev-high"
        : comment.severity === "MEDIUM"
          ? "sev-medium"
          : "sev-low";

  return (
    <article className={`comment-card ${sevClass}`}>
      <div className="comment-top">
        {comment.severity && <SeverityBadge severity={comment.severity} />}
        {comment.category && <span className="comment-cat">{comment.category}</span>}
        {onJump && comment.filePath && (
          <button type="button" className="link-button" onClick={onJump} style={{ marginLeft: "auto" }}>
            View in diff
          </button>
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
    </article>
  );
}

function FileStatusBadge({ status }: { status: string }) {
  return <span className="status-badge neutral">{status}</span>;
}

export default function PrReviewWorkspace({ pullRequestId }: { pullRequestId: string }) {
  const router = useRouter();
  const github = useGitHubConnection();
  const { pullRequest, error, isLoading, isValidating, live, refresh } =
    useLivePullRequest(pullRequestId);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<PrFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);

  const isFocusLayout = activeTab === "diff" || activeTab === "chat";

  const review = pullRequest?.review ?? null;
  const comments = review?.comments ?? [];
  const files = pullRequest?.files ?? [];

  const selectedMeta = useMemo(
    () => files.find((f) => f.id === selectedFileId) ?? null,
    [files, selectedFileId],
  );

  const fileFindings = useMemo(() => {
    if (!selectedMeta) return [];
    return comments.filter((c) => c.filePath === selectedMeta.filename);
  }, [comments, selectedMeta]);

  const filesWithFindings = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of comments) {
      if (c.filePath) map.set(c.filePath, (map.get(c.filePath) ?? 0) + 1);
    }
    return map;
  }, [comments]);

  useEffect(() => {
    if (!selectedFileId && files.length > 0) {
      setSelectedFileId(files[0].id);
    }
  }, [files, selectedFileId]);

  useEffect(() => {
    if (!pullRequestId || !selectedFileId) {
      setSelectedFile(null);
      return;
    }
    let cancelled = false;
    setFileLoading(true);
    setFileError(null);
    pullRequestsApi
      .getFile(pullRequestId, selectedFileId)
      .then((file) => {
        if (!cancelled) setSelectedFile(file);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSelectedFile(null);
          setFileError(
            err instanceof ApiError ? err.message : "Could not load file diff.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setFileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pullRequestId, selectedFileId]);

  const jumpToFile = useCallback(
    (filePath: string) => {
      const match = files.find((f) => f.filename === filePath);
      if (match) setSelectedFileId(match.id);
      setActiveTab("diff");
    },
    [files],
  );

  async function handleRetryReview() {
    if (!review) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await reviewsApi.retry(review.id);
      refresh();
    } catch (err) {
      setRetryError(err instanceof ApiError ? err.message : "Retry failed.");
    } finally {
      setRetrying(false);
    }
  }

  const title = pullRequest
    ? `#${pullRequest.githubPrNumber} ${pullRequest.title}`
    : "Pull request";

  return (
    <DashboardShell
      title={isFocusLayout ? `PR #${pullRequest?.githubPrNumber ?? ""}` : title}
      eyebrow="PR REVIEW"
      variant={isFocusLayout ? "focus" : "default"}
    >
      <div className={`pr-workspace${isFocusLayout ? " pr-workspace--focus" : ""}`}>
        <div className="pr-workspace-toolbar">
          <button
            className="secondary-button"
            onClick={() => router.push("/dashboard/pull-requests")}
          >
            <ArrowLeft size={15} />
            Pull requests
          </button>
          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() => refresh()}
              disabled={isLoading || isValidating}
            >
              <RefreshCw size={15} className={isValidating ? "spin" : ""} />
              Refresh
            </button>
            {pullRequest?.htmlUrl && (
              <a
                className="secondary-button"
                href={pullRequest.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>

        {github.isChecking || isLoading ? (
          <div className="pr-workspace-loading">
            <Loader2 size={24} className="spin" />
            <span>Loading pull request…</span>
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="pull request" />
        ) : !pullRequest ? (
          <EmptyState
            icon={<GitPullRequest size={18} />}
            title="Pull request not found"
            body="This pull request is not available in your workspace."
            action={{ label: "Back to pull requests", href: "/dashboard/pull-requests" }}
          />
        ) : (
          <>
            <header className={`pr-workspace-header${isFocusLayout ? " pr-workspace-header--compact" : ""}`}>
              <div>
                {!isFocusLayout && (
                  <p className="detail-kicker">
                    <GitPullRequest size={11} style={{ display: "inline", marginRight: 4 }} />
                    {pullRequest.repository?.fullName ?? "Repository"}
                  </p>
                )}
                <h1>{pullRequest.title}</h1>
                <p className="pr-workspace-meta">
                  {isFocusLayout && (
                    <span>{pullRequest.repository?.fullName ?? "Repository"} · </span>
                  )}
                  {pullRequest.headBranch} → {pullRequest.baseBranch} · {pullRequest.author}
                  {live && <span className="live-pill">Live</span>}
                </p>
              </div>
              <div className="pr-workspace-badges">
                <PrStatusBadge status={pullRequest.status} />
                {review && <ReviewStatusBadge status={review.status} />}
              </div>
            </header>

            <nav className="review-detail-tabs" aria-label="PR review sections">
              {(
                [
                  ["overview", "Overview", Sparkles],
                  ["diff", "Diff", Code2],
                  ["findings", "Findings", ShieldCheck, comments.length],
                  ["chat", "AI Chat", MessageSquare],
                ] as const
              ).map(([id, label, Icon, count]) => (
                <button
                  key={id}
                  type="button"
                  className={`review-detail-tab${activeTab === id ? " active" : ""}`}
                  onClick={() => setActiveTab(id as Tab)}
                  aria-current={activeTab === id ? "page" : undefined}
                >
                  <Icon size={13} />
                  {label}
                  {typeof count === "number" && count > 0 && (
                    <span className="tab-count">{count}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className={`pr-workspace-body${isFocusLayout ? " pr-workspace-body--full" : ""}`}>
              <div className="pr-workspace-main">
                {activeTab === "overview" && (
                  <OverviewPanel
                    pullRequest={pullRequest}
                    review={review}
                    comments={comments}
                    retryError={retryError}
                    onOpenDiff={() => setActiveTab("diff")}
                    onOpenFindings={() => setActiveTab("findings")}
                    onOpenChat={() => setActiveTab("chat")}
                  />
                )}

                {activeTab === "diff" && (
                  <div className={`diff-layout${filesPanelOpen ? "" : " diff-layout--files-collapsed"}`}>
                    <aside
                      className={`diff-file-list${filesPanelOpen ? "" : " diff-file-list--collapsed"}`}
                      aria-label="Changed files"
                    >
                      <div className="diff-file-list-header">
                        <strong>Files changed</strong>
                        <span>{files.length}</span>
                      </div>
                      {files.length === 0 ? (
                        <div className="diff-empty">No files changed</div>
                      ) : (
                        files.map((file) => (
                          <button
                            key={file.id}
                            type="button"
                            className={`diff-file-item${selectedFileId === file.id ? " active" : ""}`}
                            onClick={() => setSelectedFileId(file.id)}
                          >
                            <span className="diff-file-name" title={file.filename}>
                              {file.filename.split("/").pop()}
                            </span>
                            <span className="diff-file-path" title={file.filename}>
                              {file.filename}
                            </span>
                            <span className="diff-file-stats">
                              <FileStatusBadge status={file.status} />
                              <span className="diff-stat-add">+{file.additions}</span>
                              <span className="diff-stat-del">−{file.deletions}</span>
                              {(filesWithFindings.get(file.filename) ?? 0) > 0 && (
                                <span className="diff-file-findings">
                                  {filesWithFindings.get(file.filename)} findings
                                </span>
                              )}
                            </span>
                          </button>
                        ))
                      )}
                    </aside>
                    <section className="diff-panel">
                      <div className="diff-panel-header">
                        <div className="diff-panel-header-left">
                          <button
                            type="button"
                            className="icon-button diff-toggle-files"
                            aria-label={filesPanelOpen ? "Hide file list" : "Show file list"}
                            onClick={() => setFilesPanelOpen((v) => !v)}
                          >
                            {filesPanelOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                          </button>
                          <code className="diff-panel-filename" title={selectedMeta?.filename}>
                            {selectedMeta?.filename ?? "Select a file"}
                          </code>
                        </div>
                        <div className="diff-panel-chips">
                          {selectedMeta && (
                            <>
                              <span className="diff-chip">+{selectedMeta.additions}</span>
                              <span className="diff-chip diff-chip-del">−{selectedMeta.deletions}</span>
                            </>
                          )}
                          {fileLoading && <Loader2 size={14} className="spin" />}
                        </div>
                      </div>
                      <div className="diff-panel-body">
                        {fileError ? (
                          <div className="diff-empty">{fileError}</div>
                        ) : fileLoading ? (
                          <SkeletonRows rows={8} />
                        ) : (
                          <DiffViewer patch={selectedFile?.patch} findings={fileFindings} />
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "findings" && (
                  <FindingsPanel
                    review={review}
                    comments={comments}
                    onJumpToFile={jumpToFile}
                  />
                )}

                {activeTab === "chat" && (
                  <div className="pr-chat-panel">
                    {review ? (
                      <AiReviewChat review={review as Review} />
                    ) : (
                      <EmptyState
                        icon={<MessageSquare size={18} />}
                        title="Chat unavailable"
                        body="AI chat becomes available once a review has been created for this pull request."
                        action={
                          pullRequest.status === "RECEIVED" || pullRequest.status === "PROCESSING"
                            ? undefined
                            : { label: "View on GitHub", href: pullRequest.htmlUrl ?? "#" }
                        }
                      />
                    )}
                  </div>
                )}
              </div>

              {!isFocusLayout && (
              <aside className="pr-workspace-sidebar">
                <div className="detail-card">
                  <h2>Review</h2>
                  <p className="card-sub">Pipeline status</p>
                  {review ? (
                    <>
                      <ReviewStatusBadge status={review.status} />
                      {review.status === "FAILED" && (
                        <button
                          className="primary-button"
                          style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
                          onClick={() => void handleRetryReview()}
                          disabled={retrying}
                        >
                          <RefreshCw size={14} className={retrying ? "spin" : ""} />
                          {retrying ? "Retrying…" : "Retry review"}
                        </button>
                      )}
                      {review.id && (
                        <Link
                          href={`/dashboard/reviews/${review.id}`}
                          className="secondary-button"
                          style={{ width: "100%", marginTop: 10, justifyContent: "center" }}
                        >
                          Full review page
                        </Link>
                      )}
                    </>
                  ) : (
                    <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 10 }}>
                      {pullRequest.status === "RECEIVED" || pullRequest.status === "PROCESSING"
                        ? "Review is being processed…"
                        : "No review record yet."}
                    </p>
                  )}
                </div>

                <div className="detail-card">
                  <h2>Changes</h2>
                  <div className="meta-list">
                    <div className="meta-item">
                      <span>Files</span>
                      <strong>{files.length}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Additions</span>
                      <strong>{files.reduce((n, f) => n + f.additions, 0)}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Deletions</span>
                      <strong>{files.reduce((n, f) => n + f.deletions, 0)}</strong>
                    </div>
                    <div className="meta-item">
                      <span>Findings</span>
                      <strong>{comments.length}</strong>
                    </div>
                  </div>
                </div>

                {pullRequest.status === "FAILED" && pullRequest.errorMessage && (
                  <div className="detail-card" style={{ borderColor: "#ed879555" }}>
                    <h2>Error</h2>
                    <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
                      {pullRequest.errorMessage}
                    </p>
                  </div>
                )}
              </aside>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function OverviewPanel({
  pullRequest,
  review,
  comments,
  retryError,
  onOpenDiff,
  onOpenFindings,
  onOpenChat,
}: {
  pullRequest: PullRequest;
  review: PullRequest["review"];
  comments: ReviewComment[];
  retryError: string | null;
  onOpenDiff: () => void;
  onOpenFindings: () => void;
  onOpenChat: () => void;
}) {
  return (
    <div className="pr-overview-stack">
      {retryError && (
        <div className="inline-notice">
          <AlertTriangle size={14} />
          {retryError}
        </div>
      )}

      <div
        className="detail-card"
        style={{
          borderColor: "#61d8c733",
          background: "linear-gradient(115deg, #11252a, #111925 70%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="ai-icon">
            <Sparkles size={15} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 14 }}>AI Summary</h2>
            <p className="card-sub" style={{ margin: 0 }}>
              {review?.provider ? `Generated by ${review.provider}` : "Awaiting review"}
            </p>
          </div>
        </div>
        {review?.summary ? (
          <p className="review-summary" style={{ marginTop: 16 }}>
            {review.summary}
          </p>
        ) : (
          <p style={{ marginTop: 16, color: "var(--muted)", fontSize: 13 }}>
            {pullRequest.status === "RECEIVED" || pullRequest.status === "PROCESSING"
              ? "Analysis in progress — summary will appear when the review completes."
              : "No AI summary available yet."}
          </p>
        )}
        {comments.length > 0 && <FindingCounts comments={comments} />}
      </div>

      <div className="pr-quick-actions">
        <button type="button" className="secondary-button" onClick={onOpenDiff}>
          <Code2 size={15} />
          View diff
        </button>
        <button type="button" className="secondary-button" onClick={onOpenFindings}>
          <ShieldCheck size={15} />
          Findings ({comments.length})
        </button>
        <button type="button" className="secondary-button" onClick={onOpenChat}>
          <MessageSquare size={15} />
          AI chat
        </button>
      </div>

      {comments.length > 0 && (
        <div>
          <h2 style={{ fontSize: 14, marginBottom: 12 }}>Top findings</h2>
          {[...comments]
            .sort(
              (a, b) =>
                SEV_ORDER.indexOf(a.severity ?? "LOW") -
                SEV_ORDER.indexOf(b.severity ?? "LOW"),
            )
            .slice(0, 3)
            .map((c) => (
              <CommentCard key={c.id} comment={c} onJump={onOpenFindings} />
            ))}
        </div>
      )}
    </div>
  );
}

function FindingsPanel({
  review,
  comments,
  onJumpToFile,
}: {
  review: PullRequest["review"];
  comments: ReviewComment[];
  onJumpToFile: (path: string) => void;
}) {
  const byFile = useMemo(() => {
    const map = new Map<string, ReviewComment[]>();
    for (const c of comments) {
      const key = c.filePath || "(unknown)";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    for (const [, arr] of map) {
      arr.sort(
        (a, b) =>
          SEV_ORDER.indexOf(a.severity ?? "LOW") - SEV_ORDER.indexOf(b.severity ?? "LOW") ||
          (a.lineNumber ?? 0) - (b.lineNumber ?? 0),
      );
    }
    return map;
  }, [comments]);

  if (!review) {
    return (
      <EmptyState
        icon={<ShieldCheck size={18} />}
        title="No review yet"
        body="Findings will appear here once the AI review completes."
      />
    );
  }

  if (comments.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={18} />}
        title={review.status === "COMPLETED" ? "No findings" : "Analysis in progress"}
        body={
          review.status === "COMPLETED"
            ? "This review completed without reporting any issues."
            : "Findings will appear here when the review completes."
        }
      />
    );
  }

  return (
    <div className="findings-scroll-panel">
      {[...byFile.entries()].map(([filePath, fileComments]) => (
        <section key={filePath} className="findings-file-group">
          <button
            type="button"
            className="findings-file-header"
            onClick={() => onJumpToFile(filePath)}
          >
            <Code2 size={14} />
            <code>{filePath}</code>
            <span className="tab-count">{fileComments.length}</span>
          </button>
          {fileComments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              onJump={() => onJumpToFile(c.filePath)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
