"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  GitBranch,
  Loader2,
  RefreshCw,
  Settings2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { ApiError } from "@/lib/api/client";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useGitHubConnection } from "@/lib/store";

function Github({ size = 24, ...props }: { size?: number; [key: string]: unknown }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function statusLabel(status: ReturnType<typeof useGitHubConnection>["status"]): string {
  switch (status) {
    case "unknown":
      return "Checking GitHub connection…";
    case "connecting":
      return "Connecting GitHub…";
    case "syncing":
      return "Syncing repositories…";
    case "connected":
      return "GitHub connected";
    case "error":
      return "Connection error";
    default:
      return "Not connected";
  }
}

export default function GitHubIntegration() {
  const github = useGitHubConnection();
  const isBusy = github.status === "connecting" || github.status === "syncing";

  return (
    <DashboardShell title="GitHub" eyebrow="INTEGRATION">
      <div className="page-stack">
        <div className="page-header">
          <div>
            <h1>GitHub integration</h1>
            <p>
              PR Sentinel reviews pull requests through a single GitHub App. Install it
              on your account or organization and choose which repositories it can access.
            </p>
          </div>
          {github.connected && (
            <div className="page-header-actions">
              <button
                className="btn btn-secondary"
                onClick={() => github.refresh()}
                disabled={github.isFetching || isBusy}
                aria-label="Refresh GitHub connection status"
              >
                <RefreshCw size={14} className={github.isFetching ? "spin" : undefined} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {github.isChecking ? (
          <section className="github-hero">
            <div className="hero-icon">
              <Loader2 size={24} className="spin" />
            </div>
            <div>
              <h2>Checking GitHub connection…</h2>
              <p>Verifying your installation status with GitHub.</p>
            </div>
          </section>
        ) : github.status === "error" ? (
          <ErrorState
            error={
              typeof github.error === "string"
                ? new ApiError(0, github.error)
                : github.error
                  ? new ApiError(
                      github.error.status,
                      github.error.message,
                      github.error.details,
                    )
                  : new ApiError(0, "Unable to connect GitHub")
            }
            onRetry={() => {
              github.dismissError();
              github.refresh();
            }}
            resourceLabel="GitHub connection"
          />
        ) : github.connected ? (
          <ConnectedView github={github} isBusy={isBusy} />
        ) : (
          <NotConnectedView github={github} isBusy={isBusy} />
        )}
      </div>
    </DashboardShell>
  );
}

function NotConnectedView({
  github,
  isBusy,
}: {
  github: ReturnType<typeof useGitHubConnection>;
  isBusy: boolean;
}) {
  return (
    <section className="github-hero">
      <div className="hero-icon">
        <Github size={24} />
      </div>
      <div>
        <h2>Connect PR Sentinel to GitHub</h2>
        <p>
          PR Sentinel needs access to your repositories to automatically review pull
          requests as they are opened and updated. You&apos;ll be taken to GitHub to
          install the app and select repositories — PR Sentinel never sees your code
          until a pull request is opened.
        </p>
      </div>
      <div className="button-row">
        <button
          className="btn btn-primary"
          onClick={() => void github.startConnect()}
          disabled={isBusy}
        >
          {isBusy ? <Loader2 size={15} className="spin" /> : <Github size={15} />}
          {isBusy ? "Connecting GitHub…" : "Install PR Sentinel GitHub App"}
        </button>
      </div>
    </section>
  );
}

function ConnectedView({
  github,
  isBusy,
}: {
  github: ReturnType<typeof useGitHubConnection>;
  isBusy: boolean;
}) {
  return (
    <>
      <section className="detail-card" style={{ borderColor: "color-mix(in srgb, var(--success) 35%, var(--border))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
          {isBusy ? (
            <Loader2 size={20} className="spin" style={{ color: "var(--success)" }} />
          ) : (
            <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
          )}
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 650, margin: 0 }}>
            {statusLabel(github.status)}
          </h2>
        </div>
        <p className="card-sub">
          {github.status === "syncing"
            ? "Your installation is active. Updating repository list…"
            : "Your installation is active and monitoring pull requests."}
        </p>
        <div className="connected-grid">
          <div className="info-tile">
            <span>Account</span>
            <strong>
              {github.accountLogin ? `@${github.accountLogin}` : "Linked"}
            </strong>
          </div>
          <div className="info-tile">
            <span>Installation</span>
            <strong>{github.suspended ? "Suspended" : "Active"}</strong>
          </div>
          <div className="info-tile">
            <span>Repositories</span>
            <strong>{github.repositoriesCount}</strong>
          </div>
        </div>
        <div className="button-row">
          <button
            className="btn btn-secondary"
            onClick={() => void github.startConnect()}
            disabled={isBusy}
          >
            <Settings2 size={14} />
            Manage GitHub App
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => void github.syncRepositories()}
            disabled={isBusy}
          >
            <RefreshCw size={14} className={isBusy ? "spin" : undefined} />
            Sync repositories
          </button>
        </div>
      </section>

      <section className="panel-scroll-card">
        <div className="panel-scroll-header">
          <h2>Connected repositories</h2>
          <p>Repositories PR Sentinel can access through this installation.</p>
        </div>
        <div className="panel-scroll-body">
          {github.repositories.length === 0 ? (
            <EmptyState
              icon={<GitBranch size={22} />}
              title="No repositories selected"
              body="Manage the GitHub App to grant PR Sentinel access to one or more repositories."
              actions={[
                {
                  label: "Manage GitHub App",
                  onClick: () => void github.startConnect(),
                },
              ]}
              compact
            />
          ) : (
            <div className="file-list">
              {github.repositories.map((repo) => (
                <div className="file-row" key={repo.id}>
                  <div className="file-row-left">
                    <GitBranch size={15} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden />
                    <span className="file-name" title={repo.fullName}>
                      {repo.fullName}
                    </span>
                    {repo.htmlUrl && (
                      <a
                        className="link-button"
                        href={repo.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${repo.fullName} on GitHub`}
                      >
                        <ArrowUpRight size={14} />
                      </a>
                    )}
                  </div>
                  <span className={`status-badge ${repo.isActive ? "success" : "neutral"}`}>
                    {repo.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
