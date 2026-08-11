"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  Inbox,
  Lock,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { logout } from "@/lib/auth";

/** Rectangular shimmer skeleton. */
export function Skeleton({
  height = 16,
  width = "100%",
  radius = 6,
  className,
}: {
  height?: number | string;
  width?: number | string;
  radius?: number;
  className?: string;
}) {
  return (
    <span
      className={`skeleton ${className ?? ""}`}
      style={{ height, width, borderRadius: radius }}
      aria-hidden
    />
  );
}

/** A list of skeleton "rows" for tables/cards while loading. */
export function SkeletonRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-rows" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton height={44} radius={8} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ cards = 3 }: { cards?: number }) {
  return (
    <div className="skeleton-cards" role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton height={132} radius={10} key={i} />
      ))}
    </div>
  );
}

export function EmptyState({
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
  const button = action ? (
    action.href ? (
      <Link className="primary-button" href={action.href}>
        {action.label}
        <ChevronRight size={15} />
      </Link>
    ) : (
      <button className="primary-button" onClick={action.onClick}>
        {action.label}
        <ChevronRight size={15} />
      </button>
    )
  ) : null;

  return (
    <div className="workspace-empty">
      <div className="empty-icon">{icon ?? <Inbox size={18} />}</div>
      <h2>{title}</h2>
      <p>{body}</p>
      {button}
    </div>
  );
}

/**
 * Renders an appropriate message for any ApiError. Handles the special cases
 * called out in the spec: expired session (401), GitHub permission (403),
 * not-found (404), and generic/server errors with a Retry affordance.
 */
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

  if (status === 401) {
    return (
      <div className="workspace-empty error">
        <div className="empty-icon danger">
          <Lock size={18} />
        </div>
        <h2>Your session has expired</h2>
        <p>Please log in again to continue.</p>
        <button
          className="primary-button"
          onClick={async () => {
            await logout();
            router.replace("/sign-in");
          }}
        >
          Log in again
          <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  if (status === 403) {
    return (
      <div className="workspace-empty error">
        <div className="empty-icon danger">
          <ShieldAlert size={18} />
        </div>
        <h2>Access denied</h2>
        <p>
          PR Sentinel does not have access to this repository. Reconnecting
          GitHub may resolve the issue.
        </p>
        <Link className="primary-button" href="/dashboard/github">
          Reconnect GitHub
          <ChevronRight size={15} />
        </Link>
      </div>
    );
  }

  if (status === 404) {
    return (
      <div className="workspace-empty error">
        <div className="empty-icon danger">
          <AlertTriangle size={18} />
        </div>
        <h2>Not found</h2>
        <p>The {resourceLabel} you&apos;re looking for could not be found.</p>
        {onRetry && (
          <button className="primary-button" onClick={onRetry}>
            <RefreshCw size={15} />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="workspace-empty error">
      <div className="empty-icon danger">
        <AlertTriangle size={18} />
      </div>
      <h2>Something went wrong</h2>
      <p>{error?.message || `We couldn't load this ${resourceLabel}.`}</p>
      {onRetry && (
        <button className="primary-button" onClick={onRetry}>
          <RefreshCw size={15} />
          Retry
        </button>
      )}
    </div>
  );
}
