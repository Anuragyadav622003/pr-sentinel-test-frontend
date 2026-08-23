"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  GitBranch,
  GitPullRequest,
  RefreshCw,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import PrTable from "@/components/pr-table";
import { EmptyState, ErrorState, NoResults, SkeletonRows } from "@/components/ui/states";
import { usePullRequests } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";
import type { PullRequestStatus } from "@/lib/api/types";

const STATUS_OPTIONS: Array<{ value: PullRequestStatus | "ALL"; label: string }> = [
  { value: "ALL",        label: "All statuses" },
  { value: "RECEIVED",   label: "Received" },
  { value: "PROCESSING", label: "Processing" },
  { value: "REVIEWED",   label: "Reviewed" },
  { value: "FAILED",     label: "Failed" },
];

export default function PullRequestsPage() {
  const router = useRouter();
  const github = useGitHubConnection();
  const { pullRequests, error, isLoading, refresh } = usePullRequests();
  const [statusFilter, setStatusFilter] = useState<PullRequestStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = pullRequests ?? [];
    return list.filter((pr) => {
      if (statusFilter !== "ALL" && pr.status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        pr.title.toLowerCase().includes(q) ||
        pr.author.toLowerCase().includes(q) ||
        String(pr.githubPrNumber).includes(q) ||
        pr.repository?.fullName?.toLowerCase().includes(q)
      );
    });
  }, [pullRequests, search, statusFilter]);

  const failedCount = useMemo(
    () => (pullRequests ?? []).filter((p) => p.status === "FAILED").length,
    [pullRequests],
  );

  const hasFilters = search || statusFilter !== "ALL";

  return (
    <DashboardShell title="Pull Requests" eyebrow="PULL REQUESTS">
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>Pull Requests</h1>
            <p>Every pull request tracked by PR Sentinel across your connected repositories.</p>
          </div>
          <div className="page-header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => refresh()}
              disabled={isLoading}
              aria-label="Refresh pull requests"
            >
              <RefreshCw size={14} className={isLoading ? "spin" : undefined} />
              Refresh
            </button>
          </div>
        </div>

        {/* Failed callout */}
        {!isLoading && failedCount > 0 && (
          <div className="notice danger" role="alert">
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              <strong>{failedCount} pull request{failedCount !== 1 ? "s" : ""}</strong> failed to process.
              {" "}
              <button
                className="link-btn"
                style={{ color: "var(--danger)" }}
                onClick={() => setStatusFilter("FAILED")}
              >
                Show failed <ArrowRight size={12} />
              </button>
            </span>
          </div>
        )}

        {github.isChecking ? (
          <div className="panel">
            <div className="panel-header"><h2>Loading pull requests…</h2></div>
            <div className="panel-body"><SkeletonRows rows={5} /></div>
          </div>
        ) : !github.connected ? (
          <EmptyState
            icon={<GitBranch size={22} />}
            eyebrow="NOT CONNECTED"
            title="Connect GitHub to start monitoring"
            body="Install the PR Sentinel GitHub App and select repositories to begin receiving automatic AI code reviews."
            actions={[{ label: "Connect GitHub", href: "/dashboard/github" }]}
          />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="pull requests" />
        ) : (
          <>
            {/* Filter bar */}
            <div className="filter-bar">
              <input
                className="filter-input"
                type="search"
                placeholder="Search by title, author, or repo…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search pull requests"
              />
              <div className="filter-select-wrap">
                <GitPullRequest size={13} style={{ color: "var(--text-tertiary)" }} aria-hidden />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PullRequestStatus | "ALL")}
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              {!isLoading && (
                <span className="results-count">
                  {filtered.length} {filtered.length === 1 ? "pull request" : "pull requests"}
                </span>
              )}
              {hasFilters && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <SkeletonRows rows={6} />
            ) : filtered.length === 0 ? (
              hasFilters ? (
                <NoResults
                  query={search}
                  onClear={() => { setSearch(""); setStatusFilter("ALL"); }}
                />
              ) : (
                <EmptyState
                  icon={<GitPullRequest size={22} />}
                  title="No pull requests yet"
                  body="Open a pull request in one of your connected repositories and PR Sentinel will review it automatically."
                  actions={[{
                    label: "View repositories",
                    onClick: () => router.push("/dashboard/repositories"),
                    variant: "secondary",
                  }]}
                />
              )
            ) : (
              <PrTable pullRequests={filtered} />
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
