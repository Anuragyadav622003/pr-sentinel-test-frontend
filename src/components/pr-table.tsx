"use client";

import { useRouter } from "next/navigation";
import { GitPullRequest } from "lucide-react";
import { PrStatusBadge } from "@/components/ui/badges";
import type { PullRequest } from "@/lib/api/types";

function reviewCell(pr: PullRequest): string {
  if (pr.status !== "REVIEWED") return "—";
  const count = pr.review?.comments?.length;
  if (typeof count === "number") {
    return `${count} comment${count === 1 ? "" : "s"}`;
  }
  return "Reviewed";
}

function repoLabel(pr: PullRequest): string {
  return pr.repository?.name ?? pr.repository?.fullName ?? "—";
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
              <th scope="col">Author</th>
              <th scope="col">Status</th>
              <th scope="col">Review</th>
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
                aria-label={`Open pull request #${pr.githubPrNumber}: ${pr.title}`}
              >
                <td>
                  <div className="cell-pr">
                    <span className="pr-num">#{pr.githubPrNumber}</span>
                    <strong>{pr.title}</strong>
                    <small>
                      {pr.headBranch} → {pr.baseBranch}
                    </small>
                  </div>
                </td>
                {showRepo && (
                  <td>
                    <span className="cell-repo">
                      <GitPullRequest size={13} />
                      {repoLabel(pr)}
                    </span>
                  </td>
                )}
                <td>{pr.author}</td>
                <td>
                  <PrStatusBadge status={pr.status} />
                </td>
                <td>{reviewCell(pr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
