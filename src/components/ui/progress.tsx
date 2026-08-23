"use client";

/**
 * progress.tsx
 * Review pipeline progress, usage meters, and lifecycle visualisations.
 * Always answers: "What is happening?", "How far along are we?", "What's next?"
 */

import { Check, Clock, Loader2, Sparkles, XCircle, GitBranch, Code2 } from "lucide-react";
import type { ReviewStatus, PullRequestStatus } from "@/lib/api/types";

// ─── ReviewProgress ───────────────────────────────────────────────────────────

interface ReviewProgressProps {
  prStatus: PullRequestStatus;
  reviewStatus: ReviewStatus | null | undefined;
  errorMessage?: string | null;
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  state: "done" | "active" | "failed" | "pending";
}

export function ReviewProgress({ prStatus, reviewStatus, errorMessage }: ReviewProgressProps) {
  const steps: Step[] = [
    {
      id: "received",
      label: "PR received",
      description: "Webhook event processed and pull request persisted.",
      icon: GitBranch,
      state:
        prStatus === "RECEIVED"
          ? "active"
          : prStatus === "FAILED" && !reviewStatus
            ? "failed"
            : "done",
    },
    {
      id: "files",
      label: "Files fetched",
      description: "Changed files and diffs pulled from GitHub API.",
      icon: Code2,
      state:
        prStatus === "RECEIVED"
          ? "pending"
          : prStatus === "PROCESSING" && !reviewStatus
            ? "active"
            : prStatus === "FAILED" && !reviewStatus
              ? "failed"
              : "done",
    },
    {
      id: "review",
      label: "AI review",
      description: "Code analysed by the AI model for findings and summary.",
      icon: Sparkles,
      state:
        !reviewStatus
          ? prStatus === "PROCESSING"
            ? "active"
            : "pending"
          : reviewStatus === "PENDING"
            ? "active"
            : reviewStatus === "COMPLETED"
              ? "done"
              : "failed",
    },
    {
      id: "posted",
      label: "Review posted",
      description: "Findings and summary posted back to the GitHub pull request.",
      icon: Check,
      state:
        reviewStatus === "COMPLETED"
          ? "done"
          : reviewStatus === "FAILED"
            ? "failed"
            : "pending",
    },
  ];

  return (
    <div className="lifecycle" role="list" aria-label="Review pipeline">
      {steps.map((step) => {
        const Icon = step.state === "active" ? Loader2 : step.state === "done" ? Check : step.state === "failed" ? XCircle : Clock;
        return (
          <div
            key={step.id}
            className={`lifecycle-step ${step.state}`}
            role="listitem"
          >
            <div className="lc-marker" aria-hidden>
              <Icon size={13} className={step.state === "active" ? "spin" : undefined} />
            </div>
            <div className="lc-body">
              <strong>{step.label}</strong>
              <p>
                {step.state === "failed" && step.id === "review" && errorMessage
                  ? errorMessage
                  : step.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── UsageMeter ───────────────────────────────────────────────────────────────

interface UsageMeterProps {
  used: number;
  limit: number;
  label?: string;
  /** Override the fill color class (warn/danger). Auto-computed if omitted. */
  colorOverride?: "warn" | "danger";
}

export function UsageMeter({ used, limit, label, colorOverride }: UsageMeterProps) {
  const pct = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0;
  const color = colorOverride
    ? colorOverride
    : pct >= 100
      ? "danger"
      : pct >= 80
        ? "warn"
        : "";

  return (
    <div className="usage-meter">
      <div className="usage-row">
        <span>{label ?? "Usage"}</span>
        <strong>{used} / {limit}</strong>
      </div>
      <div className="usage-meter-bar" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={limit} aria-label={`${used} of ${limit} ${label ?? "uses"}`}>
        <div
          className={`usage-meter-fill ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {pct >= 100 && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginTop: "var(--sp-1)" }}>
          Daily limit reached. Add a BYOK key to continue reviewing.
        </p>
      )}
      {pct >= 80 && pct < 100 && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--warning)", marginTop: "var(--sp-1)" }}>
          {limit - used} review{limit - used !== 1 ? "s" : ""} remaining today.
        </p>
      )}
    </div>
  );
}

// ─── SeverityBar ─────────────────────────────────────────────────────────────

interface SeverityBarProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  showLegend?: boolean;
}

export function SeverityBar({ critical, high, medium, low, showLegend = true }: SeverityBarProps) {
  const total = critical + high + medium + low;
  if (total === 0) return null;

  const segments = [
    { key: "critical", count: critical, color: "var(--sev-critical)", label: "Critical" },
    { key: "high",     count: high,     color: "var(--sev-high)",     label: "High" },
    { key: "medium",   count: medium,   color: "var(--sev-medium)",   label: "Medium" },
    { key: "low",      count: low,      color: "var(--sev-low)",      label: "Low" },
  ].filter((s) => s.count > 0);

  return (
    <div>
      <div
        className="severity-bar"
        role="img"
        aria-label={`Findings: ${critical} critical, ${high} high, ${medium} medium, ${low} low`}
      >
        {segments.map(({ key, count, color }) => (
          <div
            key={key}
            className="severity-bar-seg"
            style={{ width: `${(count / total) * 100}%`, background: color }}
          />
        ))}
      </div>
      {showLegend && (
        <div className="severity-legend">
          {segments.map(({ key, count, color, label }) => (
            <span key={key} className="severity-legend-item">
              <span className="severity-legend-dot" style={{ background: color }} />
              <strong style={{ color, fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
                {count}
              </strong>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FindingCounts grid ───────────────────────────────────────────────────────

export function FindingCounts({
  critical,
  high,
  medium,
  low,
}: {
  critical: number;
  high: number;
  medium: number;
  low: number;
}) {
  return (
    <div className="findings-counts">
      <div className="finding-count critical">
        <strong>{critical}</strong>
        <span>Critical</span>
      </div>
      <div className="finding-count high">
        <strong>{high}</strong>
        <span>High</span>
      </div>
      <div className="finding-count medium">
        <strong>{medium}</strong>
        <span>Medium</span>
      </div>
      <div className="finding-count low">
        <strong>{low}</strong>
        <span>Low</span>
      </div>
    </div>
  );
}

// ─── Processing indicator ─────────────────────────────────────────────────────

export function ProcessingIndicator({ label = "AI review in progress…" }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
        padding: "var(--sp-4) var(--sp-5)",
        border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
        borderRadius: "var(--r-lg)",
        background: "var(--accent-dim)",
        color: "var(--accent)",
        fontSize: "var(--text-sm)",
        fontWeight: 500,
      }}
      role="status"
      aria-live="polite"
    >
      <Loader2 size={16} className="spin" aria-hidden />
      {label}
    </div>
  );
}
