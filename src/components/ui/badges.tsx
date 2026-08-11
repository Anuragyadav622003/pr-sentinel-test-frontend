import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";
import type {
  PullRequestStatus,
  ReviewStatus,
  Severity,
} from "@/lib/api/types";

/**
 * Status badges never rely on color alone — each carries an icon and a text
 * label so meaning is conveyed accessibly (WCAG 1.4.1).
 */

const PR_STATUS: Record<
  PullRequestStatus,
  { tone: string; label: string; Icon: typeof CircleDot; spin?: boolean }
> = {
  RECEIVED: { tone: "neutral", label: "Received", Icon: CircleDashed },
  PROCESSING: { tone: "info", label: "Processing", Icon: Loader2, spin: true },
  REVIEWED: { tone: "success", label: "Reviewed", Icon: CheckCircle2 },
  FAILED: { tone: "danger", label: "Failed", Icon: XCircle },
};

export function PrStatusBadge({ status }: { status: PullRequestStatus }) {
  const { tone, label, Icon, spin } = PR_STATUS[status];
  return (
    <span className={`status-badge ${tone}`}>
      <Icon size={12} className={spin ? "spin" : undefined} aria-hidden />
      {label}
    </span>
  );
}

const REVIEW_STATUS: Record<
  ReviewStatus,
  { tone: string; label: string; Icon: typeof CircleDot; spin?: boolean }
> = {
  PENDING: { tone: "info", label: "Pending", Icon: Clock3 },
  COMPLETED: { tone: "success", label: "Completed", Icon: CheckCircle2 },
  FAILED: { tone: "danger", label: "Failed", Icon: XCircle },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { tone, label, Icon } = REVIEW_STATUS[status];
  return (
    <span className={`status-badge ${tone}`}>
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
}

const SEVERITY: Record<
  Severity,
  { tone: string; label: string; Icon: typeof CircleDot }
> = {
  CRITICAL: { tone: "critical", label: "Critical", Icon: AlertOctagon },
  HIGH: { tone: "danger", label: "High", Icon: AlertTriangle },
  MEDIUM: { tone: "warning", label: "Medium", Icon: AlertTriangle },
  LOW: { tone: "neutral", label: "Low", Icon: CircleDot },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { tone, label, Icon } = SEVERITY[severity];
  return (
    <span className={`severity-badge ${tone}`}>
      <Icon size={12} aria-hidden />
      {label}
    </span>
  );
}

/** GitHub comment posting status: posted / not posted / posting / failed. */
export function PostedBadge({
  state,
}: {
  state: "posted" | "not-posted" | "posting" | "failed";
}) {
  switch (state) {
    case "posted":
      return (
        <span className="posted-badge success">
          <CheckCircle2 size={12} aria-hidden />
          Posted to GitHub
        </span>
      );
    case "posting":
      return (
        <span className="posted-badge info">
          <Loader2 size={12} className="spin" aria-hidden />
          Posting to GitHub…
        </span>
      );
    case "failed":
      return (
        <span className="posted-badge danger">
          <AlertTriangle size={12} aria-hidden />
          Failed to post
        </span>
      );
    default:
      return (
        <span className="posted-badge neutral">
          <CircleDashed size={12} aria-hidden />
          Not posted
        </span>
      );
  }
}
