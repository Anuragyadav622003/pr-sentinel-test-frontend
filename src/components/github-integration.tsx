"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  GitBranch,
  RefreshCw,
  Settings2,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { EmptyState, ErrorState, SkeletonRows } from "@/components/ui/states";
import { githubApi } from "@/lib/api/github";
import { getInstallUrl, useGitHubInstallation, useRepositories } from "@/lib/api/hooks";

/**
 * Prefer the backend-built URL: it carries a single-use `state` bound to the
 * session, which GitHub echoes back to /github/setup. The static env URL is
 * only a fallback — it has no state, so the backend falls back to claiming
 * the installation from the session cookie.
 */
async function beginInstall(): Promise<void> {
  try {
    const { installUrl } = await githubApi.startInstall();
    window.location.assign(installUrl);
  } catch {
    const fallback = getInstallUrl();
    if (fallback) window.location.assign(fallback);
  }
}

export default function GitHubIntegration() {
  const { status, error, isLoading, refresh } = useGitHubInstallation();
  const repos = useRepositories();
  const [installUrlMissing] = useState(() => !getInstallUrl());

  return (
    <DashboardShell title="GitHub" eyebrow="INTEGRATION">
      <div className="data-header">
        <div>
          <h1 className="text-balance">GitHub integration</h1>
          <p className="text-pretty">
            PR Sentinel reviews pull requests through a single GitHub App. Install it
            on your account or organization and choose which repositories it can access.
          </p>
        </div>
        {status?.connected && (
          <div className="header-actions">
            <button className="secondary-button" onClick={() => refresh()}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refresh()} resourceLabel="connection status" />
      ) : status?.connected ? (
        <ConnectedView
          accountLogin={status.installation?.accountLogin ?? null}
          repositoryCount={status.repositoryCount}
          repos={repos}
        />
      ) : (
        <NotConnectedView installUrlMissing={installUrlMissing} />
      )}
    </DashboardShell>
  );
}

function NotConnectedView({ installUrlMissing }: { installUrlMissing: boolean }) {
  const [starting, setStarting] = useState(false);

  const onInstall = () => {
    setStarting(true);
    void beginInstall().finally(() => setStarting(false));
  };

  return (
    <section className="github-hero">
      <div className="hero-icon">
        <GitBranch size={22} />
      </div>
      <div>
        <h2>Connect PR Sentinel to GitHub</h2>
        <p className="text-pretty">
          PR Sentinel needs access to your repositories to automatically review pull
          requests as they are opened and updated. You&apos;ll be taken to GitHub to
          install the app and select repositories — PR Sentinel never sees your code
          until a pull request is opened.
        </p>
      </div>
      {installUrlMissing ? (
        <div className="inline-notice">
          <AlertTriangle size={15} />
          The GitHub App install URL is not configured. Set
          {" "}
          <code>NEXT_PUBLIC_GITHUB_APP_INSTALL_URL</code> to enable installation.
        </div>
      ) : (
        <div className="button-row">
          <button className="primary-button" onClick={onInstall} disabled={starting}>
            <GitBranch size={16} />
            {starting ? "Opening GitHub…" : "Install PR Sentinel GitHub App"}
          </button>
        </div>
      )}
    </section>
  );
}

function ConnectedView({
  accountLogin,
  repositoryCount,
  repos,
}: {
  accountLogin: string | null;
  repositoryCount: number;
  repos: ReturnType<typeof useRepositories>;
}) {
  return (
    <>
      <section className="detail-card" style={{ borderColor: "#70d9a544" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <CheckCircle2 size={18} color="var(--success)" />
          <h2 style={{ margin: 0 }}>GitHub connected</h2>
        </div>
        <p className="card-sub">Your installation is active and monitoring pull requests.</p>
        <div className="connected-grid">
          <div className="info-tile">
            <span>Account</span>
            <strong>{accountLogin ? `@${accountLogin}` : "Linked"}</strong>
          </div>
          <div className="info-tile">
            <span>Installation</span>
            <strong>Active</strong>
          </div>
          <div className="info-tile">
            <span>Repositories</span>
            <strong>{repositoryCount}</strong>
          </div>
        </div>
        <div className="button-row">
          <button className="secondary-button" onClick={beginInstall}>
            <Settings2 size={15} />
            Manage GitHub App
          </button>
          <button className="secondary-button" onClick={beginInstall}>
            <RefreshCw size={15} />
            Reconnect
          </button>
        </div>
      </section>

      <section className="detail-card">
        <h2>Connected repositories</h2>
        <p className="card-sub">Repositories PR Sentinel can access through this installation.</p>
        {repos.isLoading ? (
          <SkeletonRows rows={4} />
        ) : repos.error ? (
          <ErrorState error={repos.error} onRetry={() => repos.refresh()} resourceLabel="repositories" />
        ) : !repos.repositories || repos.repositories.length === 0 ? (
          <EmptyState
            title="No repositories selected"
            body="Manage the GitHub App to grant PR Sentinel access to one or more repositories."
            action={{ label: "Manage GitHub App", onClick: beginInstall }}
          />
        ) : (
          <div className="file-list">
            {repos.repositories.map((repo) => (
              <div className="file-row" key={repo.id}>
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
                <span className={`status-badge ${repo.isActive ? "success" : "neutral"}`}>
                  {repo.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
