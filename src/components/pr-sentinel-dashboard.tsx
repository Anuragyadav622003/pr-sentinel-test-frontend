"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Code2,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { PrStatusBadge, ReviewStatusBadge } from "@/components/ui/badges";
import { SkeletonStatCards, SkeletonRows, ErrorState, EmptyState } from "@/components/ui/states";
import { UsageMeter } from "@/components/ui/progress";
import { useDashboardStats } from "@/lib/api/hooks";
import { llmApi } from "@/lib/api/llm";
import { getDisplayName, getStoredUser } from "@/lib/auth";
import type { LlmModeStatus, PullRequest } from "@/lib/api/types";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  foot,
  footVariant,
  loading,
  href,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  foot: React.ReactNode;
  footVariant?: "success" | "danger" | "warning";
  loading?: boolean;
  href?: string;
}) {
  const inner = (
    <article className="stat-card">
      <div className="stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-value">
        {loading ? (
          <span className="skeleton" style={{ display: "block", height: 28, width: 64, borderRadius: 4 }} aria-hidden />
        ) : value}
      </div>
      <div className={`stat-foot${footVariant ? ` ${footVariant}` : ""}`}>{foot}</div>
    </article>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

// ─── PR table row ─────────────────────────────────────────────────────────────

function RecentPrRow({ pr }: { pr: PullRequest }) {
  const review = pr.review;
  const criticalCount = review?.comments?.filter((c) => c.severity === "CRITICAL").length ?? 0;
  const highCount     = review?.comments?.filter((c) => c.severity === "HIGH").length ?? 0;
  const totalFindings = review?.comments?.length ?? 0;

  return (
    <Link
      href={`/dashboard/pull-requests/${pr.id}`}
      style={{ display: "contents" }}
    >
      <tr className="clickable" tabIndex={0}>
        <td>
          <div className="cell-pr">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <GitPullRequest size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} aria-hidden />
              <strong>{pr.title}</strong>
            </div>
            <span className="pr-num">
              #{pr.githubPrNumber} · {pr.repository?.fullName ?? pr.author}
            </span>
          </div>
        </td>
        <td>
          <PrStatusBadge status={pr.status} />
        </td>
        <td>
          {review ? (
            <ReviewStatusBadge status={review.status} />
          ) : (
            <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>—</span>
          )}
        </td>
        <td>
          {totalFindings === 0 ? (
            <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>—</span>
          ) : (
            <div style={{ display: "flex", gap: "var(--sp-2)", alignItems: "center", flexWrap: "wrap" }}>
              {criticalCount > 0 && (
                <span className="risk-chip critical">{criticalCount} critical</span>
              )}
              {highCount > 0 && (
                <span className="risk-chip high">{highCount} high</span>
              )}
              {criticalCount === 0 && highCount === 0 && (
                <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>
                  {totalFindings} finding{totalFindings !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </td>
        <td style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
          {new Date(pr.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </td>
      </tr>
    </Link>
  );
}

// ─── Next action banner ───────────────────────────────────────────────────────

function NextActionBanner({ connected }: { connected: boolean }) {
  if (connected) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-4)",
        padding: "var(--sp-4) var(--sp-5)",
        border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
        borderRadius: "var(--r-lg)",
        background: "var(--accent-dim)",
      }}
    >
      <div style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--accent-dim)", color: "var(--accent)", flexShrink: 0 }}>
        <GitBranch size={18} aria-hidden />
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ display: "block", fontSize: "var(--text-md)", color: "var(--text)" }}>
          Connect GitHub to get started
        </strong>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginTop: 3 }}>
          Install the PR Sentinel GitHub App and select repositories to begin receiving automatic AI reviews.
        </p>
      </div>
      <Link href="/dashboard/github" className="btn btn-primary" style={{ flexShrink: 0 }}>
        Connect GitHub <ArrowRight size={14} />
      </Link>
    </div>
  );
}

// ─── AI quota card ────────────────────────────────────────────────────────────

function QuotaCard() {
  const [status, setStatus] = useState<LlmModeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const ac = new AbortController();
    llmApi.getMode(ac.signal).then(setStatus).catch(() => {}).finally(() => setLoading(false));
    return () => ac.abort();
  }, []);

  const isByok = status?.llmMode === "BYOK";
  const dailyLimit = 5;
  const remaining  = status?.remainingFree ?? dailyLimit;
  const used = dailyLimit - remaining;

  return (
    <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)", flexWrap: "wrap" }}>
      <div style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "var(--r-md)", background: "var(--accent-dim)", color: "var(--accent)", flexShrink: 0 }}>
        {isByok ? <Sparkles size={18} aria-hidden /> : <Zap size={18} aria-hidden />}
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        <strong style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 600 }}>
          {isByok ? "BYOK — unlimited reviews" : "Free tier reviews"}
        </strong>
        {loading ? (
          <span className="skeleton" style={{ display: "block", height: 10, width: 120, marginTop: 8, borderRadius: 4 }} />
        ) : isByok ? (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>Using your own API key.</span>
        ) : (
          <div style={{ marginTop: "var(--sp-2)" }}>
            <UsageMeter used={used} limit={dailyLimit} label="Reviews today" />
          </div>
        )}
      </div>
      <Link href="/dashboard/settings" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>
        {isByok ? "Manage keys" : "Add BYOK key"} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PRSentinelDashboard() {
  const { stats, error, isLoading, refresh, connectionStatus } = useDashboardStats();
  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const firstName = user ? getDisplayName(user).split(/[\s@]+/)[0] : "there";
  const connected     = stats?.connected ?? false;
  const checkingGitHub = connectionStatus === "unknown";
  const loading = isLoading || checkingGitHub;

  return (
    <DashboardShell title="Dashboard" eyebrow="OVERVIEW">
      <div className="page-stack">
        {/* Header */}
        <div className="page-header" style={{ marginBottom: "var(--sp-2)" }}>
          <div>
            <h1>Welcome back, {firstName}</h1>
            <p>
              {connected
                ? "Here's the state of automated reviews across your connected repositories."
                : "Get started by connecting your GitHub account to begin reviewing pull requests."}
            </p>
          </div>
          <div className="page-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => refresh()}
              disabled={loading}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={14} className={loading ? "spin" : undefined} />
              Refresh
            </button>
            <Link href="/dashboard/pull-requests" className="btn btn-primary">
              <GitPullRequest size={14} />
              Pull Requests
            </Link>
          </div>
        </div>

        {/* Next action — only when not connected */}
        <NextActionBanner connected={connected} />

        {/* Error */}
        {error && (
          <ErrorState error={error} onRetry={refresh} resourceLabel="dashboard" />
        )}

        {!error && (
          <>
            {/* Stats */}
            {loading ? (
              <SkeletonStatCards count={5} />
            ) : (
              <section className="stats-grid" aria-label="Workspace metrics">
                <StatCard
                  label="GitHub"
                  value={connected ? "Connected" : "Not connected"}
                  icon={<GitBranch size={15} aria-hidden />}
                  foot={connected ? `${stats?.repositoryCount ?? 0} repos monitored` : "Installation required"}
                  footVariant={connected ? "success" : "danger"}
                  href="/dashboard/github"
                />
                <StatCard
                  label="Repositories"
                  value={stats?.repositoryCount ?? 0}
                  icon={<Code2 size={15} aria-hidden />}
                  foot="Connected repositories"
                  href="/dashboard/repositories"
                />
                <StatCard
                  label="Pull Requests"
                  value={stats?.pullRequestCount ?? 0}
                  icon={<GitPullRequest size={15} aria-hidden />}
                  foot="Tracked by PR Sentinel"
                  href="/dashboard/pull-requests"
                />
                <StatCard
                  label="Reviewed"
                  value={stats?.reviewedCount ?? 0}
                  icon={<CheckCircle2 size={15} aria-hidden />}
                  foot="Completed AI reviews"
                  footVariant={stats?.reviewedCount ? "success" : undefined}
                  href="/dashboard/reviews"
                />
                <StatCard
                  label="Failed"
                  value={stats?.failedCount ?? 0}
                  icon={<XCircle size={15} aria-hidden />}
                  foot={stats?.failedCount ? "Need attention" : "All reviews healthy"}
                  footVariant={stats?.failedCount ? "danger" : "success"}
                  href={stats?.failedCount ? "/dashboard/pull-requests?status=FAILED" : undefined}
                />
              </section>
            )}

            {/* AI quota */}
            <QuotaCard />

            {/* Recent PRs */}
            <section className="panel" aria-label="Recent pull requests">
              <div className="panel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2>Recent pull requests</h2>
                  <p>Most recently updated across all connected repositories.</p>
                </div>
                <Link href="/dashboard/pull-requests" className="btn btn-ghost btn-sm">
                  View all <ArrowRight size={13} />
                </Link>
              </div>
              <div className="panel-body">
                {loading ? (
                  <SkeletonRows rows={5} />
                ) : !connected ? (
                  <EmptyState
                    icon={<GitBranch size={20} />}
                    title="No repositories connected"
                    body="Install the PR Sentinel GitHub App to start receiving automated AI code reviews."
                    actions={[{ label: "Connect GitHub", href: "/dashboard/github" }]}
                    compact
                  />
                ) : !stats?.recentPullRequests.length ? (
                  <EmptyState
                    icon={<GitPullRequest size={20} />}
                    title="No pull requests yet"
                    body="Open a pull request in one of your connected repositories and PR Sentinel will review it automatically."
                    compact
                  />
                ) : (
                  <div className="data-table-wrap" style={{ border: 0, borderRadius: 0 }}>
                    <div className="data-table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Pull Request</th>
                            <th>Status</th>
                            <th>Review</th>
                            <th>Risk</th>
                            <th>Updated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentPullRequests.map((pr) => (
                            <RecentPrRow key={pr.id} pr={pr} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Failed PRs callout */}
            {!loading && connected && (stats?.failedCount ?? 0) > 0 && (
              <div className="notice danger" role="alert">
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>{stats!.failedCount} pull request{stats!.failedCount !== 1 ? "s" : ""}</strong> failed during review.
                  {" "}
                  <Link href="/dashboard/pull-requests" style={{ color: "var(--danger)", textDecoration: "underline" }}>
                    View and retry →
                  </Link>
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
