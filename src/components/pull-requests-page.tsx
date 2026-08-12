"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GitBranch, GitPullRequest, Loader2, RefreshCw } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import PrTable from "@/components/pr-table";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { usePullRequests } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";
import type { PullRequestStatus } from "@/lib/api/types";

const STATUS_OPTIONS: Array<PullRequestStatus | "ALL"> = [
  "ALL",
  "RECEIVED",
  "PROCESSING",
  "REVIEWED",
  "FAILED",
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

  return (
    <DashboardShell title="Pull requests" eyebrow="PULL REQUESTS">
      <div className="page-stack">
        <div className="data-header">
          <div>
            <h1 className="text-balance">Pull requests</h1>
            <p className="text-pretty">
              Every pull request tracked by PR Sentinel across your connected repositories.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() => refresh()}
              disabled={isLoading || github.isFetching}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {github.isChecking ? (
          <section className="panel-scroll-card">
            <div className="panel-scroll-header">
              <h2>Loading pull requests…</h2>
            </div>
            <SkeletonRows rows={5} />
          </section>
        ) : !github.connected ? (
          <EmptyState
            icon={<GitBranch size={18} />}
            title="Connect GitHub to get started"
            body="Install the PR Sentinel GitHub App and select repositories to begin receiving automatic pull request reviews."
            action={{ label: "Connect GitHub", href: "/dashboard/github" }}
          />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="pull requests" />
        ) : (
          <>
            <div className="filter-bar">
              <input
                className="filter-input"
                type="search"
                placeholder="Search pull requests…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search pull requests"
              />
              <div className="filter-select">
                <GitPullRequest size={13} style={{ color: "var(--muted)" }} />
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as PullRequestStatus | "ALL")
                  }
                  aria-label="Filter by status"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All statuses" : option}
                    </option>
                  ))}
                </select>
              </div>
              {!isLoading && (
                <span className="results-count">
                  {filtered.length} {filtered.length === 1 ? "pull request" : "pull requests"}
                </span>
              )}
            </div>

            <section className="panel-scroll-card">
              <div className="panel-scroll-header">
                <div>
                  <h2>Review queue</h2>
                  <p>Click a pull request to open its detail and review status.</p>
                </div>
              </div>
              <div className="panel-scroll-body">
                {isLoading ? (
                  <SkeletonRows rows={6} />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={<GitPullRequest size={18} />}
                    title="No pull requests yet"
                    body="Open a pull request in one of your connected repositories and PR Sentinel will review it automatically."
                    action={{
                      label: "View repositories",
                      onClick: () => router.push("/dashboard/repositories"),
                    }}
                  />
                ) : (
                  <PrTable pullRequests={filtered} />
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
