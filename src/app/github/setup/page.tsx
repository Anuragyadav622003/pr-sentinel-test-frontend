"use client";

/**
 * /github/setup
 * The GitHub App "Setup URL". GitHub redirects here after an install or a
 * permissions update with `installation_id`, `state` and `setup_action`.
 * This page forwards them to the backend, which links the installation to the
 * signed-in user and syncs repositories, then sends the user to the GitHub
 * integration page.
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, GitBranch, Loader2, LogIn } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { githubApi, getInstallUrl } from "@/lib/api/github";
import type { GitHubInstallationStatus } from "@/lib/api/types";

const DESTINATION = "/dashboard/github";
const REDIRECT_DELAY_MS = 1500;

type Phase = "connecting" | "syncing" | "success" | "error";
type ErrorKind = "params" | "auth" | "state" | "generic";

function SetupContent() {
  const router = useRouter();
  const params = useSearchParams();

  const installationId = params.get("installation_id");
  const state = params.get("state");
  const setupAction = params.get("setup_action");

  const [phase, setPhase] = useState<Phase>("connecting");
  const [errorKind, setErrorKind] = useState<ErrorKind>("generic");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<GitHubInstallationStatus | null>(null);
  const [attempt, setAttempt] = useState(0);
  // React Strict Mode double-invokes effects in dev; complete the install once
  // per attempt so repository sync is never triggered twice.
  const ranFor = useRef(-1);

  useEffect(() => {
    if (ranFor.current === attempt) return;
    ranFor.current = attempt;

    if (!installationId) {
      setErrorKind("params");
      setErrorMsg("Missing installation ID.");
      setPhase("error");
      return;
    }

    const controller = new AbortController();
    setPhase("connecting");
    const syncTimer = setTimeout(() => setPhase("syncing"), 900);

    githubApi
      .completeInstall({ installationId, state, setupAction }, controller.signal)
      .then((status) => {
        if (!status.connected) {
          throw new ApiError(0, "The installation could not be verified.");
        }
        setResult(status);
        setPhase("success");
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof ApiError && err.isAuth) {
          setErrorKind(state ? "state" : "auth");
        } else {
          setErrorKind("generic");
        }
        setErrorMsg(
          err instanceof Error ? err.message : "The installation could not be completed."
        );
        setPhase("error");
      })
      .finally(() => clearTimeout(syncTimer));

    return () => {
      clearTimeout(syncTimer);
      controller.abort();
    };
  }, [attempt, installationId, state, setupAction]);

  useEffect(() => {
    if (phase !== "success") return;
    const timer = setTimeout(() => router.replace(DESTINATION), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, router]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  if (phase === "connecting" || phase === "syncing") {
    return (
      <div className="callback-card" role="status" aria-live="polite">
        <div className="callback-icon loading">
          <Loader2 size={24} className="spin" aria-hidden />
        </div>
        <h1>Connecting GitHub…</h1>
        <p>
          {phase === "syncing"
            ? "Syncing repositories…"
            : "Installing repository access. This only takes a moment."}
        </p>
      </div>
    );
  }

  if (phase === "success") {
    return (
      <div className="callback-card" role="status" aria-live="polite">
        <div className="callback-icon success">
          <CheckCircle2 size={26} aria-hidden />
        </div>
        <h1>GitHub connected successfully</h1>
        <p>Your repositories have been synchronized. Redirecting…</p>
        <div className="callback-detail">
          <div className="callback-detail-row">
            <span>Installation</span>
            <strong>
              {result?.installation?.accountLogin
                ? `@${result.installation.accountLogin}`
                : "Active"}
            </strong>
          </div>
          <div className="callback-detail-row">
            <span>Repositories</span>
            <strong>{result?.repositoryCount ?? 0} connected</strong>
          </div>
        </div>
        <div className="callback-actions">
          <button className="primary-button" onClick={() => router.replace(DESTINATION)}>
            Go to GitHub integration
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorCard kind={errorKind} message={errorMsg} onRetry={retry} />
  );
}

function ErrorCard({
  kind,
  message,
  onRetry,
}: {
  kind: ErrorKind;
  message: string;
  onRetry: () => void;
}) {
  const [startingInstall, setStartingInstall] = useState(false);

  const restartInstall = async () => {
    setStartingInstall(true);
    try {
      const { installUrl } = await githubApi.startInstall();
      window.location.assign(installUrl);
    } catch {
      const fallback = getInstallUrl();
      if (fallback) window.location.assign(fallback);
      else setStartingInstall(false);
    }
  };

  if (kind === "auth") {
    return (
      <div className="callback-card" role="alert">
        <div className="callback-icon error">
          <AlertTriangle size={26} aria-hidden />
        </div>
        <h1>Sign in to finish connecting</h1>
        <p>
          GitHub connection requires an authenticated PR Sentinel account. Please sign
          in and try again.
        </p>
        <div className="callback-actions">
          <Link className="primary-button" href="/sign-in">
            <LogIn size={16} />
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (kind === "state") {
    return (
      <div className="callback-card" role="alert">
        <div className="callback-icon error">
          <AlertTriangle size={26} aria-hidden />
        </div>
        <h1>GitHub installation could not be verified</h1>
        <p>
          Your installation session may have expired. Please start the GitHub connection
          process again.
        </p>
        <div className="callback-actions">
          <button
            className="primary-button"
            onClick={restartInstall}
            disabled={startingInstall}
          >
            <GitBranch size={16} />
            {startingInstall ? "Opening GitHub…" : "Connect GitHub again"}
          </button>
          <Link className="secondary-button" href={DESTINATION}>
            Back to integration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="callback-card" role="alert">
      <div className="callback-icon error">
        <AlertTriangle size={26} aria-hidden />
      </div>
      <h1>Unable to complete GitHub installation</h1>
      <p>{message || "We couldn't finish connecting your GitHub installation."}</p>
      <div className="callback-actions">
        {kind === "params" ? (
          <button
            className="primary-button"
            onClick={restartInstall}
            disabled={startingInstall}
          >
            <GitBranch size={16} />
            {startingInstall ? "Opening GitHub…" : "Try again"}
          </button>
        ) : (
          <button className="primary-button" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link className="secondary-button" href={DESTINATION}>
          Back to integration
        </Link>
      </div>
    </div>
  );
}

export default function GitHubSetupPage() {
  return (
    <main className="callback-shell">
      <Suspense
        fallback={
          <div className="callback-card">
            <div className="callback-icon loading">
              <Loader2 size={24} className="spin" aria-hidden />
            </div>
            <h1>Loading…</h1>
          </div>
        }
      >
        <SetupContent />
      </Suspense>
    </main>
  );
}
