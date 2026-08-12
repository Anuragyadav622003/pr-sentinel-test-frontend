"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  GitBranch,
  GitPullRequest,
  Loader2,
  RefreshCw,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import PrTable from "@/components/pr-table";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useRepository, useRepositoryPullRequests } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";

export default function RepositoryDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const github = useGitHubConnection();
  const { repository, error, isLoading, refresh } = useRepository(id);
  const prs = useRepositoryPullRequests(id);

  return (
    <DashboardShell
      title={repository?.name ?? "Repository"}
      eyebrow="REPOSITORY"
    >
      <div className="page-stack">
        <div className="detail-nav-row">
          <button
            className="secondary-button"
            onClick={() => router.push("/dashboard/repositories")}
          >
            <ArrowLeft size={15} />
            Back to repositories
          </button>
          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() => {
                refresh();
                prs.refresh();
              }}
              disabled={isLoading || prs.isLoading}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            {repository?.htmlUrl && (
              <a
                className="secondary-button"
                href={repository.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open on GitHub
                <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>

        {github.isChecking || isLoading ? (
          <section className="panel-scroll-card">
            <SkeletonRows rows={4} />
          </section>
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="repository" />
        ) : !repository ? (
          <EmptyState
            icon={<Code2 size={18} />}
            title="Repository not found"
            body="This repository is not available in your workspace."
            action={{ label: "Back to repositories", href: "/dashboard/repositories" }}
          />
        ) : (
          <>
            <section className="detail-card">
              <div className="detail-title-row">
                <div>
                  <p className="detail-kicker">
                    <Code2 size={11} style={{ display: "inline", marginRight: 4 }} />
                    Connected repository
                  </p>
                  <h1>{repository.fullName}</h1>
                </div>
                <span className={`status-badge ${repository.isActive ? "success" : "neutral"}`}>
                  {repository.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="connected-grid" style={{ marginTop: 18 }}>
                <div className="info-tile">
                  <span>Pull requests</span>
                  <strong>{repository.pullRequestCount ?? 0}</strong>
                </div>
                <div className="info-tile">
                  <span>Reviews</span>
                  <strong>{repository.reviewCount ?? 0}</strong>
                </div>
                <div className="info-tile">
                  <span>Owner</span>
                  <strong>{repository.owner}</strong>
                </div>
              </div>
            </section>

            <section className="panel-scroll-card">
              <div className="panel-scroll-header">
                <div>
                  <h2>Pull requests</h2>
                  <p>Pull requests tracked for this repository.</p>
                </div>
              </div>
              <div className="panel-scroll-body">
                {prs.isLoading ? (
                  <SkeletonRows rows={5} />
                ) : prs.error ? (
                  <ErrorState
                    error={prs.error}
                    onRetry={() => prs.refresh()}
                    resourceLabel="pull requests"
                  />
                ) : !prs.pullRequests || prs.pullRequests.length === 0 ? (
                  <EmptyState
                    icon={<GitPullRequest size={18} />}
                    title="No pull requests yet"
                    body="Open a pull request in this repository on GitHub to start receiving reviews."
                    action={
                      !github.connected
                        ? { label: "Connect GitHub", href: "/dashboard/github" }
                        : undefined
                    }
                  />
                ) : (
                  <PrTable pullRequests={prs.pullRequests} showRepo={false} />
                )}
              </div>
            </section>

            {!github.connected && (
              <section className="detail-card">
                <EmptyState
                  icon={<GitBranch size={18} />}
                  title="GitHub connection required"
                  body="Reconnect GitHub to keep monitoring this repository."
                  action={{ label: "Connect GitHub", href: "/dashboard/github" }}
                />
              </section>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
