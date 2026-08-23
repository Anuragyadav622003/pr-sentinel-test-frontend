/**
 * badges.tsx
 * Reusable badge/chip components for the PR Sentinel design system.
 * Every badge conveys meaning through both color AND an icon (WCAG 1.4.1).
 * All color values reference CSS custom properties — never hardcoded.
 */

import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Clock,
  GitBranch,
  Loader2,
  XCircle,
} from "lucide-react";
import type {
  PullRequestStatus,
  ReviewStatus,
  Severity,
} from "@/lib/api/types";

// ─── PR Status ────────────────────────────────────────────────────────────────

const PR_META: Record<
  PullRequestStatus,
  { cls: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  RECEIVED:   { cls: "badge badge-neutral", label: "Received",   Icon: CircleDashed },
  PROCESSING: { cls: "badge badge-info",    label: "Processing", Icon: Loader2 },
  REVIEWED:   { cls: "badge badge-success", label: "Reviewed",   Icon: CheckCircle2 },
  FAILED:     { cls: "badge badge-danger",  label: "Failed",     Icon: XCircle },
};

export function PrStatusBadge({ status }: { status: PullRequestStatus }) {
  const { cls, label, Icon } = PR_META[status];
  return (
    <span className={cls} role="status">
      <Icon size={11} className={status === "PROCESSING" ? "spin" : undefined} aria-hidden />
      {label}
    </span>
  );
}

// ─── Review Status ────────────────────────────────────────────────────────────

const REVIEW_META: Record<
  ReviewStatus,
  { cls: string; label: string; Icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  PENDING:   { cls: "badge badge-info",    label: "Pending",   Icon: Clock },
  COMPLETED: { cls: "badge badge-success", label: "Completed", Icon: CheckCircle2 },
  FAILED:    { cls: "badge badge-danger",  label: "Failed",    Icon: XCircle },
};

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { cls, label, Icon } = REVIEW_META[status];
  return (
    <span className={cls} role="status">
      <Icon size={11} aria-hidden />
      {label}
    </span>
  );
}

// ─── Severity ─────────────────────────────────────────────────────────────────

const SEV_META: Record<
  Severity,
  { cls: string; label: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  CRITICAL: { cls: "badge badge-critical", label: "Critical", Icon: AlertOctagon },
  HIGH:     { cls: "badge badge-high",     label: "High",     Icon: AlertTriangle },
  MEDIUM:   { cls: "badge badge-medium",   label: "Medium",   Icon: AlertTriangle },
  LOW:      { cls: "badge badge-low",      label: "Low",      Icon: CircleDot },
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { cls, label, Icon } = SEV_META[severity];
  return (
    <span className={cls}>
      <Icon size={11} aria-hidden />
      {label}
    </span>
  );
}

/** Inline risk chip — compact pill used in table rows. */
export function RiskChip({ severity }: { severity: Severity | null | undefined }) {
  if (!severity) return null;
  const clsMap: Record<Severity, string> = {
    CRITICAL: "risk-chip critical",
    HIGH:     "risk-chip high",
    MEDIUM:   "risk-chip medium",
    LOW:      "risk-chip low",
  };
  return <span className={clsMap[severity]}>{severity}</span>;
}

/** Clean result chip — shown when a review has zero findings. */
export function CleanChip() {
  return (
    <span className="risk-chip clean">
      <CheckCircle2 size={10} aria-hidden />
      Clean
    </span>
  );
}

// ─── GitHub posting status ────────────────────────────────────────────────────

export function PostedBadge({
  state,
}: {
  state: "posted" | "not-posted" | "posting" | "failed";
}) {
  switch (state) {
    case "posted":
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={11} aria-hidden /> Posted to GitHub
        </span>
      );
    case "posting":
      return (
        <span className="badge badge-info">
          <Loader2 size={11} className="spin" aria-hidden /> Posting…
        </span>
      );
    case "failed":
      return (
        <span className="badge badge-danger">
          <AlertTriangle size={11} aria-hidden /> Failed to post
        </span>
      );
    default:
      return (
        <span className="badge badge-neutral">
          <CircleDashed size={11} aria-hidden /> Not posted
        </span>
      );
  }
}

// ─── Connection status badge ──────────────────────────────────────────────────

export function ConnectionBadge({
  connected,
  checking,
}: {
  connected: boolean;
  checking?: boolean;
}) {
  if (checking) {
    return (
      <span className="badge badge-neutral">
        <Loader2 size={11} className="spin" aria-hidden /> Checking…
      </span>
    );
  }
  return connected ? (
    <span className="badge badge-success">
      <GitBranch size={11} aria-hidden /> Connected
    </span>
  ) : (
    <span className="badge badge-danger">
      <GitBranch size={11} aria-hidden /> Not connected
    </span>
  );
}

// ─── Active / Inactive badge ──────────────────────────────────────────────────

export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="badge badge-success">
      <CircleDot size={11} aria-hidden /> Active
    </span>
  ) : (
    <span className="badge badge-neutral">
      <CircleDashed size={11} aria-hidden /> Inactive
    </span>
  );
}
