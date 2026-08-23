"use client";

import { useRouter } from "next/navigation";
import { GitPullRequest, MapPin } from "lucide-react";
import { PrStatusBadge, ReviewStatusBadge } from "@/components/ui/badges";
import type { PullRequest, Severity } from "@/lib/api/types";

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function topSeverity(pr: PullRequest): Severity | null {
  const comments = pr.review?.comments ?? [];
  for (const sev of SEV_ORDER) {
    if (comments.some((c) => c.severity === sev)) return sev;
  }
  return null;
}

function RiskCell({ pr }: { pr: PullRequest }) {
  const comments = pr.review?.comments ?? [];
  const total = comments.length;

  if (pr.status !== "REVIEWED" || !pr.review) {
    return <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>—</span>;
  }

  if (total === 0) {
    return <span className="risk-chip clean">✓ Clean</span>;
  }

  const top = topSeverity(pr);
  const countMap: Partial<Record<Severity, number>> = {};
  for (const c of comments) {
    countMap[c.severity] = (countMap[c.severity] ?? 0) + 1;
  }

  const clsMap: Record<Severity, string> = {
    CRITICAL: "risk-chip critical",
    HIGH:     "risk-chip high",
    MEDIUM:   "risk-chip medium",
    LOW:      "risk-chip low",
  };

  return (
    <div style={{ display: "flex", gap: "var(--sp-1)", flexWrap: "wrap", alignItems: "center" }}>
      {top && (
        <span className={clsMap[top]}>
          {countMap[top]} {top.charAt(0) + top.slice(1).toLowerCase()}
        </span>
      )}
      {total > (countMap[top!] ?? 0) && (
        <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>
          +{total - (countMap[top!] ?? 0)} more
        </span>
      )}
    </div>
  );
}

export default function PrTable({
  pullRequests,
  showRepo = true,
}: {
  pullRequests: PullRequest[];
  showRepo?: boolean;
}) {
  const router = useRouter();

  function open(id: string) {
    router.push(`/dashboard/pull-requests/${id}`);
  }

  return (
    <div className="data-table-wrap">
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Pull request</th>
              {showRepo && <th scope="col">Repository</th>}
              <th scope="col">Status</th>
              <th scope="col">Review</th>
              <th scope="col">Risk</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {pullRequests.map((pr) => (
              <tr
                key={pr.id}
                className="clickable"
                tabIndex={0}
                onClick={() => open(pr.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(pr.id);
                  }
                }}
                aria-label={`Open PR #${pr.githubPrNumber}: ${pr.title}`}
              >
                <td style={{ maxWidth: 340 }}>
                  <div className="cell-pr">
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                      <GitPullRequest size={13} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} aria-hidden />
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {pr.title}
                      </strong>
                    </div>
                    <span className="pr-num">
                      #{pr.githubPrNumber}
                      {pr.author && ` · ${pr.author}`}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-tertiary)", fontSize: 10, fontFamily: "var(--font-mono)" }}>
                      <MapPin size={9} aria-hidden />
                      {pr.headBranch} → {pr.baseBranch}
                    </span>
                  </div>
                </td>
                {showRepo && (
                  <td>
                    <span className="cell-repo">
                      {pr.repository?.name ?? pr.repository?.fullName ?? "—"}
                    </span>
                  </td>
                )}
                <td><PrStatusBadge status={pr.status} /></td>
                <td>
                  {pr.review ? (
                    <ReviewStatusBadge status={pr.review.status} />
                  ) : (
                    <span style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)" }}>—</span>
                  )}
                </td>
                <td><RiskCell pr={pr} /></td>
                <td style={{ color: "var(--text-tertiary)", fontSize: "var(--text-xs)", whiteSpace: "nowrap" }}>
                  {new Date(pr.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
