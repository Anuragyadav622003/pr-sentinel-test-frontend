"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Activity, GitBranch, GitPullRequest, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { usePullRequests, useReviews } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";

type ActivityItem = {
  id: string;
  kind: "pull-request" | "review";
  title: string;
  subtitle: string;
  timestamp: string;
  href: string;
};

export default function ActivityPage() {
  const router = useRouter();
  const github = useGitHubConnection();
  const prs = usePullRequests();
  const reviews = useReviews();

  const items = useMemo<ActivityItem[]>(() => {
    const prItems: ActivityItem[] = (prs.pullRequests ?? []).map((pr) => ({
      id: `pr-${pr.id}`,
      kind: "pull-request",
      title: `#${pr.githubPrNumber} ${pr.title}`,
      subtitle: `${pr.repository?.fullName ?? "Repository"} · ${pr.status}`,
      timestamp: pr.updatedAt,
      href: `/dashboard/pull-requests/${pr.id}`,
    }));
    const reviewItems: ActivityItem[] = (reviews.reviews ?? []).map((review) => ({
      id: `review-${review.id}`,
      kind: "review",
      title: `Review ${review.id.slice(0, 8)}`,
      subtitle: `${review.status} · ${review.comments?.length ?? 0} findings`,
      timestamp: review.updatedAt,
      href: `/dashboard/reviews/${review.id}`,
    }));
    return [...prItems, ...reviewItems].sort(
      (a, b) => +new Date(b.timestamp) - +new Date(a.timestamp),
    );
  }, [prs.pullRequests, reviews.reviews]);

  const isLoading = github.isChecking || prs.isLoading || reviews.isLoading;
  const error = prs.error ?? reviews.error;

  return (
    <DashboardShell title="Activity" eyebrow="ACTIVITY">
      <div className="page-stack">
        <div className="data-header">
          <div>
            <h1 className="text-balance">Audit activity</h1>
            <p className="text-pretty">
              A chronological record of pull request and review events in your workspace.
            </p>
          </div>
        </div>

        {isLoading ? (
          <section className="panel-scroll-card">
            <SkeletonRows rows={6} />
          </section>
        ) : !github.connected ? (
          <EmptyState
            icon={<GitBranch size={18} />}
            title="Connect GitHub to get started"
            body="Activity appears here once PR Sentinel starts tracking your repositories."
            action={{ label: "Connect GitHub", href: "/dashboard/github" }}
          />
        ) : error ? (
          <ErrorState
            error={error}
            onRetry={() => {
              prs.refresh();
              reviews.refresh();
            }}
            resourceLabel="activity"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Activity size={18} />}
            title="No activity yet"
            body="Events will appear here when pull requests are opened and reviewed."
            action={{
              label: "View pull requests",
              onClick: () => router.push("/dashboard/pull-requests"),
            }}
          />
        ) : (
          <section className="panel-scroll-card">
            <div className="panel-scroll-header">
              <h2>Recent activity</h2>
              <p>Latest pull request and review events.</p>
            </div>
            <div className="panel-scroll-body">
              <div className="activity-list">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="activity-row"
                    onClick={() => router.push(item.href)}
                  >
                    <span className="activity-icon">
                      {item.kind === "pull-request" ? (
                        <GitPullRequest size={14} />
                      ) : (
                        <ShieldCheck size={14} />
                      )}
                    </span>
                    <span className="activity-copy">
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </span>
                    <span className="activity-time">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
