"use client";

/**
 * states.tsx
 * Reusable loading, empty, and error state components.
 * Every state clearly communicates: what happened, why, and what to do next.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  GitBranch,
  Inbox,
  Lock,
  RefreshCw,
  SearchX,
  Server,
  ShieldAlert,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { logout } from "@/lib/auth";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({
  height = 16,
  width = "100%",
  radius = 4,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
}) {
  return (
    <span
      className="skeleton"
      style={{ height, width, borderRadius: radius, display: "block" }}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ["85%", "70%", "55%"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={13} width={widths[i % widths.length]} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-rows" role="status" aria-label="Loading…">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-row skeleton" />
      ))}
    </div>
  );
}

export function SkeletonCards({ cards = 3 }: { cards?: number }) {
  return (
    <div className="skeleton-cards" role="status" aria-label="Loading…">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} height={140} radius={12} />
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 5 }: { count?: number }) {
  return (
    <div className="stats-grid" role="status" aria-label="Loading metrics…">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="stat-card">
          <Skeleton height={11} width="55%" />
          <Skeleton height={28} width="45%" radius={4} />
          <Skeleton height={10} width="65%" />
        </div>
      ))}
    </div>
  );
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 24, label = "Loading…" }: { size?: number; label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--sp-3)",
        padding: "var(--sp-10)",
        color: "var(--text-tertiary)",
        fontSize: "var(--text-sm)",
      }}
      role="status"
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="spin"
        aria-hidden
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <span>{label}</span>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
}

export function EmptyState({
  icon,
  eyebrow,
  title,
  body,
  actions,
  compact,
}: {
  icon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  body: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
}) {
  return (
    <div
      className="state-wrap"
      style={{ minHeight: compact ? 160 : undefined, padding: compact ? "var(--sp-6)" : undefined }}
    >
      <div className="state-icon">{icon ?? <Inbox size={20} />}</div>
      {eyebrow && (
        <span
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          {eyebrow}
        </span>
      )}
      <h2 className="state-title">{title}</h2>
      <p className="state-body">{body}</p>
      {actions && actions.length > 0 && (
        <div className="state-actions">
          {actions.map((action, i) => {
            const cls = `btn ${action.variant === "secondary" ? "btn-secondary" : "btn-primary"}`;
            return action.href ? (
              <Link key={i} href={action.href} className={cls}>
                {action.label}
                <ChevronRight size={14} />
              </Link>
            ) : (
              <button key={i} className={cls} onClick={action.onClick}>
                {action.label}
                <ChevronRight size={14} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Convenience wrapper with single action (backwards compat)
export function EmptyStateSimple({
  icon,
  title,
  body,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick?: () => void; href?: string };
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      body={body}
      actions={action ? [action] : undefined}
    />
  );
}

// ─── No results (filtered empty) ─────────────────────────────────────────────

export function NoResults({
  query,
  onClear,
}: {
  query?: string;
  onClear?: () => void;
}) {
  return (
    <div className="state-wrap" style={{ minHeight: 160, padding: "var(--sp-6)" }}>
      <div className="state-icon">
        <SearchX size={20} />
      </div>
      <h2 className="state-title">No results found</h2>
      <p className="state-body">
        {query
          ? `No items match "${query}". Try adjusting your search or filters.`
          : "No items match your current filters."}
      </p>
      {onClear && (
        <button className="btn btn-secondary" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

export function ErrorState({
  error,
  onRetry,
  resourceLabel = "data",
}: {
  error: ApiError | Error | undefined;
  onRetry?: () => void;
  resourceLabel?: string;
}) {
  const router = useRouter();
  const status = error instanceof ApiError ? error.status : undefined;

  // Expired session
  if (status === 401) {
    return (
      <div className="state-wrap">
        <div className="state-icon danger">
          <Lock size={20} />
        </div>
        <h2 className="state-title">Session expired</h2>
        <p className="state-body">
          Your session has expired. Please sign in again to continue.
        </p>
        <div className="state-actions">
          <button
            className="btn btn-primary"
            onClick={async () => {
              await logout();
              router.replace("/sign-in");
            }}
          >
            Sign in again
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Access denied / GitHub permission
  if (status === 403) {
    return (
      <div className="state-wrap">
        <div className="state-icon danger">
          <ShieldAlert size={20} />
        </div>
        <h2 className="state-title">Access denied</h2>
        <p className="state-body">
          PR Sentinel doesn&apos;t have access to this {resourceLabel}. Reconnecting
          your GitHub App installation may resolve this.
        </p>
        <div className="state-actions">
          <Link href="/dashboard/github" className="btn btn-primary">
            Reconnect GitHub
            <ChevronRight size={14} />
          </Link>
          {onRetry && (
            <button className="btn btn-secondary" onClick={onRetry}>
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Not found
  if (status === 404) {
    return (
      <div className="state-wrap">
        <div className="state-icon warning">
          <AlertTriangle size={20} />
        </div>
        <h2 className="state-title">Not found</h2>
        <p className="state-body">
          The {resourceLabel} you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <div className="state-actions">
          <button className="btn btn-ghost" onClick={() => router.back()}>
            ← Go back
          </button>
          {onRetry && (
            <button className="btn btn-secondary" onClick={onRetry}>
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Server error
  if (status && status >= 500) {
    return (
      <div className="state-wrap">
        <div className="state-icon danger">
          <Server size={20} />
        </div>
        <h2 className="state-title">Server error</h2>
        <p className="state-body">
          Something went wrong on our end. This is usually temporary.
        </p>
        <div className="state-actions">
          {onRetry && (
            <button className="btn btn-primary" onClick={onRetry}>
              <RefreshCw size={14} />
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // GitHub not connected
  if (status === 0 || (error instanceof ApiError && error.isForbidden)) {
    return (
      <div className="state-wrap">
        <div className="state-icon">
          <GitBranch size={20} />
        </div>
        <h2 className="state-title">GitHub not connected</h2>
        <p className="state-body">
          Connect your GitHub account to start monitoring pull requests.
        </p>
        <div className="state-actions">
          <Link href="/dashboard/github" className="btn btn-primary">
            Connect GitHub
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // Generic
  return (
    <div className="state-wrap">
      <div className="state-icon danger">
        <AlertTriangle size={20} />
      </div>
      <h2 className="state-title">Something went wrong</h2>
      <p className="state-body">
        {error?.message || `We couldn't load this ${resourceLabel}. Please try again.`}
      </p>
      <div className="state-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            <RefreshCw size={14} />
            Try again
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => router.back()}>
          ← Go back
        </button>
      </div>
    </div>
  );
}

// ─── Inline error notice ──────────────────────────────────────────────────────

export function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="notice danger" role="alert">
      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onRetry && (
        <button
          className="btn btn-ghost btn-sm"
          onClick={onRetry}
          style={{ flexShrink: 0 }}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
