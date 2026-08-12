"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  GitBranch,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { useReviews } from "@/lib/api/hooks";
import { useGitHubConnection } from "@/lib/store";
import type { ReviewComment, Severity } from "@/lib/api/types";

type FindingRow = ReviewComment & {
  reviewId: string;
  pullRequestId: string;
};

const SEV_OPTIONS: Array<Severity | "ALL"> = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

function severityBadge(severity: Severity) {
  const map: Record<Severity, string> = {
    CRITICAL: "critical",
    HIGH: "danger",
    MEDIUM: "warning",
    LOW: "neutral",
  };
  return <span className={`severity-badge ${map[severity]}`}>{severity}</span>;
}

export default function FindingsPage() {
  const router = useRouter();
  const github = useGitHubConnection();
  const { reviews, error, isLoading, refresh } = useReviews();
  const [severityFilter, setSeverityFilter] = useState<Severity | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const findings = useMemo<FindingRow[]>(() => {
    const rows: FindingRow[] = [];
    for (const review of reviews ?? []) {
      for (const comment of review.comments ?? []) {
        rows.push({
          ...comment,
          reviewId: review.id,
          pullRequestId: review.pullRequestId,
        });
      }
    }
    return rows.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [reviews]);

  const filtered = useMemo(() => {
    return findings.filter((finding) => {
      if (severityFilter !== "ALL" && finding.severity !== severityFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        finding.message.toLowerCase().includes(q) ||
        finding.filePath.toLowerCase().includes(q) ||
        finding.category.toLowerCase().includes(q)
      );
    });
  }, [findings, search, severityFilter]);

  return (
    <DashboardShell title="Findings" eyebrow="FINDINGS">
      <div className="page-stack">
        <div className="data-header">
          <div>
            <h1 className="text-balance">Security findings</h1>
            <p className="text-pretty">
              Review issues detected across completed pull request reviews.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="secondary-button"
              onClick={() => refresh()}
              disabled={isLoading}
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {github.isChecking ? (
          <section className="panel-scroll-card">
            <SkeletonRows rows={5} />
          </section>
        ) : !github.connected ? (
          <EmptyState
            icon={<GitBranch size={18} />}
            title="Connect GitHub to get started"
            body="Findings appear here after PR Sentinel completes AI reviews on your connected repositories."
            action={{ label: "Connect GitHub", href: "/dashboard/github" }}
          />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refresh()} resourceLabel="findings" />
        ) : (
          <>
            <div className="filter-bar">
              <input
                className="filter-input"
                type="search"
                placeholder="Search findings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search findings"
              />
              <div className="filter-select">
                <AlertTriangle size={13} style={{ color: "var(--muted)" }} />
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as Severity | "ALL")}
                  aria-label="Filter by severity"
                >
                  {SEV_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All severities" : option}
                    </option>
                  ))}
                </select>
              </div>
              {!isLoading && (
                <span className="results-count">
                  {filtered.length} {filtered.length === 1 ? "finding" : "findings"}
                </span>
              )}
            </div>

            <section className="panel-scroll-card">
              <div className="panel-scroll-header">
                <h2>All findings</h2>
                <p>Click a finding to open its review.</p>
              </div>
              <div className="panel-scroll-body">
                {isLoading ? (
                  <SkeletonRows rows={6} />
                ) : filtered.length === 0 ? (
                  <EmptyState
                    icon={<ShieldCheck size={18} />}
                    title="No findings yet"
                    body="Findings appear here once PR Sentinel completes reviews on your pull requests."
                    action={{
                      label: "View pull requests",
                      onClick: () => router.push("/dashboard/pull-requests"),
                    }}
                  />
                ) : (
                  <div className="file-list findings-list">
                    {filtered.map((finding) => (
                      <button
                        type="button"
                        key={finding.id}
                        className="finding-row"
                        onClick={() => router.push(`/dashboard/reviews/${finding.reviewId}`)}
                      >
                        <div className="finding-row-main">
                          <div className="finding-row-top">
                            {severityBadge(finding.severity)}
                            <span className="finding-category">{finding.category}</span>
                          </div>
                          <strong>{finding.message}</strong>
                          <span className="finding-path">
                            <MapPin size={12} />
                            {finding.filePath}
                            {finding.lineNumber != null ? `:${finding.lineNumber}` : ""}
                          </span>
                        </div>
                        <ShieldCheck size={14} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
