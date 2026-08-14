"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Code2,
  GitBranch,
  GitPullRequest,
  XCircle,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import PrTable from "@/components/pr-table";
import { EmptyState, ErrorState, Skeleton, SkeletonRows } from "@/components/ui/states";
import { useDashboardStats } from "@/lib/api/hooks";
import { getStoredUser, getDisplayName } from "@/lib/auth";

function StatCard({
  label,
  value,
  icon,
  foot,
  loading,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  foot: string;
  loading?: boolean;
}) {
  return (
    <article className="stat-card" aria-label={`${label}: ${loading ? "Loading" : value}`}>
      <div className="stat-head">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-value">{loading ? <Skeleton height={26} width={64} /> : value}</div>
      <div className="stat-foot">{foot}</div>
    </article>
  );
}

export default function PRSentinelDashboard() {
  const { stats, error, isLoading, refresh, connectionStatus } = useDashboardStats();

  const user = typeof window !== "undefined" ? getStoredUser() : null;
  const firstName = user ? getDisplayName(user).split(/[\s@]+/)[0] : "there";

  const connected = stats?.connected;
  const checkingGitHub = connectionStatus === "unknown";

  return (
    <DashboardShell title="Dashboard" eyebrow="OVERVIEW">
      <div className="page-stack">
      <div className="data-header">
        <div>
          <h1 className="text-balance">Welcome back, {firstName}</h1>
          <p className="text-pretty">
            Here&apos;s the current state of automated reviews across your connected
            repositories.
          </p>
        </div>
        <div className="header-actions">
          <Link className="secondary-button" href="/dashboard/pull-requests">
            <GitPullRequest size={15} />
            View pull requests
          </Link>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={refresh} resourceLabel="dashboard" />
      ) : (
        <>
          <section className="stats-grid" aria-label="Workspace metrics">
            <StatCard
              label="GitHub"
              loading={isLoading || checkingGitHub}
              value={
                checkingGitHub
                  ? "Checking…"
                  : connected
                    ? "Connected"
                    : "Not connected"
              }
              icon={<GitBranch size={16} />}
              foot={
                checkingGitHub
                  ? "Verifying installation"
                  : connected
                    ? "Installation active"
                    : "Connect to begin"
              }
            />
            <StatCard
              label="Repositories"
              loading={isLoading}
              value={stats?.repositoryCount ?? 0}
              icon={<Code2 size={16} />}
              foot="Monitored repositories"
            />
            <StatCard
              label="Pull requests"
              loading={isLoading}
              value={stats?.pullRequestCount ?? 0}
              icon={<GitPullRequest size={16} />}
              foot="Tracked by PR Sentinel"
            />
            <StatCard
              label="Reviewed"
              loading={isLoading}
              value={stats?.reviewedCount ?? 0}
              icon={<CheckCircle2 size={16} />}
              foot="Completed AI reviews"
            />
            <StatCard
              label="Failed"
              loading={isLoading}
              value={stats?.failedCount ?? 0}
              icon={<XCircle size={16} />}
              foot="Require attention"
            />
          </section>

          <section className="panel-scroll-card">
            <div className="panel-scroll-header">
              <h2>Recent pull requests</h2>
              <p>The most recently updated pull requests in your workspace.</p>
            </div>
            <div className="panel-scroll-body">
            {isLoading || checkingGitHub ? (
              <SkeletonRows rows={4} />
            ) : !connected ? (
              <EmptyState
                icon={<GitBranch size={18} />}
                title="Connect GitHub to get started"
                body="Install the PR Sentinel GitHub App and select repositories to begin receiving automatic pull request reviews."
                action={{ label: "Connect GitHub", href: "/dashboard/github" }}
              />
            ) : !stats || stats.recentPullRequests.length === 0 ? (
              <EmptyState
                icon={<GitPullRequest size={18} />}
                title="No pull requests yet"
                body="Open a pull request in one of your connected repositories and PR Sentinel will review it automatically."
                action={{ label: "View repositories", href: "/dashboard/repositories" }}
              />
            ) : (
              <PrTable pullRequests={stats.recentPullRequests} />
            )}
            </div>
          </section>
        </>
      )}
      </div>
    </DashboardShell>
  );
}
