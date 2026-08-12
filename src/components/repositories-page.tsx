"use client";

import Link from "next/link";
import { Code2, GitBranch, GitPullRequest, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/states";
import { useGitHubInstallation, useRepositories } from "@/lib/api/hooks";
import type { Repository } from "@/lib/api/types";

function RepoCard({ repo }: { repo: Repository }) {
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
      <div className="repo-card-stats">
        <div>
          <span>Pull requests</span>
          <strong>{repo.pullRequestCount ?? 0}</strong>
        </div>
        <div>
          <span>Reviews</span>
          <strong>{repo.reviewCount ?? 0}</strong>
        </div>
      </div>
    </Link>
  );
}

export default function RepositoriesPage() {
  const { status } = useGitHubInstallation();
  const { repositories, error, isLoading, refresh } = useRepositories();

  return (
    <DashboardShell title="Repositories" eyebrow="REPOSITORIES">
      <div className="data-header">
        <div>
          <h1 className="text-balance">Repositories</h1>
          <p className="text-pretty">
            Repositories connected to PR Sentinel through your GitHub App installation.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonCards cards={6} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refresh()} resourceLabel="repositories" />
      ) : !repositories || repositories.length === 0 ? (
        <EmptyState
          icon={<GitBranch size={18} />}
          title="No repositories connected"
          body={
            status?.connected
              ? "Your installation has no repositories selected yet. Manage the GitHub App to grant access."
              : "Install the PR Sentinel GitHub App and select repositories to begin reviewing pull requests."
          }
          action={{ label: "Connect GitHub", href: "/dashboard/github" }}
        />
      ) : (
        <div className="repo-grid">
          {repositories.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
