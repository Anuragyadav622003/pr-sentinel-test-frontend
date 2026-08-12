"use client";

import Link from "next/link";
import { Code2, GitBranch, Loader2 } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/states";
import { ApiError } from "@/lib/api/client";
import { useGitHubConnection } from "@/lib/store";
import type { RepositorySummary } from "@/lib/api/types";

function RepoCard({ repo }: { repo: RepositorySummary }) {
  return (
    <Link
      href={`/dashboard/repositories/${repo.id}`}
      className={`repo-card ${repo.isActive ? "" : "inactive"}`}
    >
      <div className="repo-card-top">
        <div>
          <div className="repo-card-name">
            <Code2 size={16} />
            {repo.name}
          </div>
          <div className="repo-card-full">{repo.fullName}</div>
        </div>
        <span className={`status-badge ${repo.isActive ? "success" : "neutral"}`}>
          {repo.isActive ? "Active" : "Inactive"}
        </span>
      </div>
    </Link>
  );
}

export default function RepositoriesPage() {
  const github = useGitHubConnection();

  const errorMessage =
    typeof github.error === "string"
      ? new ApiError(0, github.error)
      : github.error
        ? new ApiError(
            github.error.status,
            github.error.message,
            github.error.details,
          )
        : undefined;

  return (
    <DashboardShell title="Repositories" eyebrow="REPOSITORIES">
      <div className="page-stack">
      <div className="data-header">
        <div>
          <h1 className="text-balance">Repositories</h1>
          <p className="text-pretty">
            Repositories connected to PR Sentinel through your GitHub App installation.
          </p>
        </div>
        {github.connected && (
          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() => void github.syncRepositories()}
              disabled={github.status === "syncing"}
            >
              {github.status === "syncing" ? (
                <Loader2 size={15} className="spin" />
              ) : null}
              Sync from GitHub
            </button>
          </div>
        )}
      </div>

      {github.isChecking ? (
        <section className="github-hero">
          <div className="hero-icon">
            <Loader2 size={22} className="spin" />
          </div>
          <div>
            <h2>Checking GitHub connection…</h2>
            <p className="text-pretty">Loading your connected repositories.</p>
          </div>
        </section>
      ) : github.status === "error" ? (
        <ErrorState
          error={errorMessage ?? new ApiError(0, "Unable to load repositories")}
          onRetry={() => github.refresh()}
          resourceLabel="repositories"
        />
      ) : github.repositories.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={18} />}
          title="No repositories connected"
          body={
            github.connected
              ? "Your installation has no repositories selected yet. Manage the GitHub App to grant access."
              : "Install the PR Sentinel GitHub App and select repositories to begin reviewing pull requests."
          }
          action={{ label: "Connect GitHub", href: "/dashboard/github" }}
        />
      ) : (
        <section className="panel-scroll-card">
          <div className="panel-scroll-header">
            <h2>Connected repositories</h2>
            <p>{github.repositoriesCount} repositories available through your installation.</p>
          </div>
          <div className="panel-scroll-body">
            <div className="repo-grid repo-grid-scroll">
              {github.repositories.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </div>
        </section>
      )}
      </div>
    </DashboardShell>
  );
}
