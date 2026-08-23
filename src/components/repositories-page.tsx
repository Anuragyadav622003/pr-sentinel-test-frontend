"use client";

import Link from "next/link";
import {
  ArrowRight,
  Code2,
  GitBranch,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { ActiveBadge } from "@/components/ui/badges";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/states";
import { ApiError } from "@/lib/api/client";
import { useGitHubConnection } from "@/lib/store";
import type { RepositorySummary } from "@/lib/api/types";

function RepoCard({ repo }: { repo: RepositorySummary }) {
  const [owner, name] = repo.fullName.split("/");
  return (
    <Link
      href={`/dashboard/repositories/${repo.id}`}
      className={`repo-card${repo.isActive ? "" : " inactive"}`}
      aria-label={`Open repository ${repo.fullName}`}
    >
      <div className="repo-card-header">
        <div>
          <div className="repo-card-name">
            <Code2 size={15} aria-hidden />
            {name ?? repo.name}
          </div>
          <div className="repo-card-full">{owner}/{name ?? repo.name}</div>
        </div>
        <ActiveBadge active={repo.isActive} />
      </div>
      {repo.htmlUrl && (
        <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}>
          github.com/{repo.fullName}
        </span>
      )}
      <div className="repo-card-stats">
        <div className="repo-stat">
          <span>Pull Requests</span>
          <strong>—</strong>
        </div>
        <div className="repo-stat">
          <span>Reviews</span>
          <strong>—</strong>
        </div>
      </div>
    </Link>
  );
}

export default function RepositoriesPage() {
  const github = useGitHubConnection();

  const error = github.error
    ? new ApiError(
        typeof github.error === "string" ? 0 : github.error.status,
        typeof github.error === "string" ? github.error : github.error.message,
      )
    : undefined;

  return (
    <DashboardShell title="Repositories" eyebrow="REPOSITORIES">
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>Repositories</h1>
            <p>
              All GitHub repositories accessible through your PR Sentinel installation.
            </p>
          </div>
          {github.connected && (
            <div className="page-header-actions">
              <button
                className="btn btn-secondary"
                onClick={() => void github.syncRepositories()}
                disabled={github.status === "syncing"}
                aria-label="Sync repositories from GitHub"
              >
                <RefreshCw size={14} className={github.status === "syncing" ? "spin" : undefined} />
                Sync from GitHub
              </button>
              <Link href="/dashboard/github" className="btn btn-ghost">
                <GitBranch size={14} />
                Manage app
              </Link>
            </div>
          )}
        </div>

        {github.isChecking ? (
          <SkeletonCards cards={6} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => github.refresh()} resourceLabel="repositories" />
        ) : !github.connected ? (
          <EmptyState
            icon={<GitBranch size={22} />}
            eyebrow="NOT CONNECTED"
            title="Connect GitHub to see your repositories"
            body="Install the PR Sentinel GitHub App and grant access to the repositories you want to monitor."
            actions={[{ label: "Connect GitHub", href: "/dashboard/github" }]}
          />
        ) : github.repositories.length === 0 ? (
          <EmptyState
            icon={<Code2 size={22} />}
            title="No repositories found"
            body="Your GitHub App installation has no repositories selected. Manage the app to grant access to repositories."
            actions={[
              { label: "Manage GitHub App", href: "/dashboard/github" },
              { label: "Sync repositories", onClick: () => void github.syncRepositories(), variant: "secondary" },
            ]}
          />
        ) : (
          <>
            {/* Summary */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              <span>
                <strong style={{ color: "var(--text)" }}>
                  {github.repositories.filter((r) => r.isActive).length}
                </strong>{" "}
                active of{" "}
                <strong style={{ color: "var(--text)" }}>{github.repositories.length}</strong>{" "}
                repositories
              </span>
              {github.accountLogin && (
                <>
                  <span style={{ color: "var(--border-strong)" }}>·</span>
                  <span>
                    <GitBranch size={12} style={{ display: "inline", marginRight: 4 }} aria-hidden />
                    {github.accountLogin}
                  </span>
                </>
              )}
            </div>

            <div className="repo-grid">
              {github.repositories.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
