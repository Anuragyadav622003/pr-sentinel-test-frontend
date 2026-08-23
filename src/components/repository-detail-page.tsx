"use client";

import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Code2,
  GitPullRequest,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import PrTable from "@/components/pr-table";
import { ActiveBadge } from "@/components/ui/badges";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useRepository, useRepositoryPullRequests } from "@/lib/api/hooks";

export default function RepositoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router  = useRouter();
  const { repository, error, isLoading, refresh } = useRepository(id);
  const prs = useRepositoryPullRequests(id);

  const reviewedCount = (prs.pullRequests ?? []).filter((p) => p.status === "REVIEWED").length;
  const failedCount   = (prs.pullRequests ?? []).filter((p) => p.status === "FAILED").length;

  return (
    <DashboardShell
      title={repository?.name ?? "Repository"}
      eyebrow="REPOSITORY"
    >
      <div className="page-stack">
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--sp-3)", flexWrap: "wrap" }}>
          <button
            className="btn btn-ghost"
            onClick={() => router.push("/dashboard/repositories")}
          >
            <ArrowLeft size={15} /> Repositories
          </button>
          <div style={{ display: "flex", gap: "var(--sp-2)" }}>
            <button
              className="btn btn-secondary"
              onClick={() => { refresh(); void prs.refresh(); }}
              disabled={isLoading || prs.isLoading}
            >
              <RefreshCw size={14} className={isLoading ? "spin" : undefined} />
              Refresh
            </button>
            {repository?.htmlUrl && (
              <a className="btn btn-secondary" href={repository.htmlUrl} target="_blank" rel="noopener noreferrer">
                Open on GitHub <ArrowUpRight size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <SkeletonRows rows={4} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="repository" />
        ) : !repository ? (
          <EmptyState
            icon={<Code2 size={22} />}
            title="Repository not found"
            body="This repository is not available in your workspace."
            actions={[{ label: "Back to repositories", href: "/dashboard/repositories" }]}
          />
        ) : (
          <>
            {/* Header card */}
            <div className="card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--sp-4)", flexWrap: "wrap" }}>
                <div>
                  <p className="detail-kicker" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: "var(--sp-2)" }}>
                    <Code2 size={11} aria-hidden /> Connected repository
                  </p>
                  <h1 style={{ fontSize: "clamp(18px,2.5vw,26px)", letterSpacing: "-.035em" }}>
                    {repository.fullName}
                  </h1>
                  {repository.htmlUrl && (
                    <a
                      href={repository.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "var(--sp-2)", color: "var(--text-tertiary)", fontSize: "var(--text-xs)", fontFamily: "var(--font-mono)" }}
                    >
                      github.com/{repository.fullName} <ArrowUpRight size={10} />
                    </a>
                  )}
                </div>
                <ActiveBadge active={repository.isActive} />
              </div>

              {/* Stats row */}
              <div className="info-grid" style={{ marginTop: "var(--sp-5)" }}>
                <div className="info-tile">
                  <span className="label">Pull requests</span>
                  <span className="value">{prs.pullRequests?.length ?? repository.pullRequestCount ?? 0}</span>
                </div>
                <div className="info-tile">
                  <span className="label">Reviewed</span>
                  <span className="value" style={{ color: reviewedCount > 0 ? "var(--success)" : undefined }}>
                    {reviewedCount}
                  </span>
                </div>
                <div className="info-tile">
                  <span className="label">Failed</span>
                  <span className="value" style={{ color: failedCount > 0 ? "var(--danger)" : undefined }}>
                    {failedCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Pull requests */}
            <div className="panel">
              <div className="panel-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2>Pull requests</h2>
                  <p>All pull requests tracked for this repository.</p>
                </div>
                <Link href={`/dashboard/pull-requests?repositoryId=${id}`} className="btn btn-ghost btn-sm">
                  View all <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="panel-body">
                {prs.isLoading ? (
                  <SkeletonRows rows={5} />
                ) : prs.error ? (
                  <ErrorState error={prs.error} onRetry={() => void prs.refresh()} resourceLabel="pull requests" />
                ) : !prs.pullRequests?.length ? (
                  <EmptyState
                    icon={<GitPullRequest size={20} />}
                    title="No pull requests yet"
                    body="Open a pull request in this repository on GitHub to start receiving AI reviews."
                    compact
                  />
                ) : (
                  <PrTable pullRequests={prs.pullRequests} showRepo={false} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
