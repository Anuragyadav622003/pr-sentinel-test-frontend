"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, GitBranch, Loader2 } from "lucide-react";
import { getInstallUrl } from "@/lib/api/github";
import { useCompleteGitHubInstall, useGitHubConnection } from "@/lib/store";

type Phase = "verifying" | "syncing" | "success" | "error";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { complete, isLoading } = useCompleteGitHubInstall();
  const { status: connectionStatus } = useGitHubConnection();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [repoCount, setRepoCount] = useState(0);
  const [accountLogin, setAccountLogin] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const githubError = params.get("error_description") || params.get("error");
    if (githubError) {
      setErrorMsg(githubError);
      setPhase("error");
      return;
    }

    const installationId = params.get("installation_id");
    const setupAction = params.get("setup_action");
    const state = params.get("state");

    if (!installationId) {
      setErrorMsg("Missing installation_id from GitHub.");
      setPhase("error");
      return;
    }

    complete({
      installationId,
      state,
      setupAction,
    })
      .then((result) => {
        if (result.connected) {
          setAccountLogin(result.installation?.accountLogin ?? null);
          setRepoCount(result.repositoryCount);
          setPhase("syncing");
        } else {
          setErrorMsg("The installation could not be verified.");
          setPhase("error");
        }
      })
      .catch((err: unknown) => {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "The installation could not be verified.";
        setErrorMsg(message);
        setPhase("error");
      });
  }, [complete, params]);

  // After backend sync completes, show success then redirect.
  useEffect(() => {
    if (phase !== "syncing") return;
    if (connectionStatus === "connected" || connectionStatus === "syncing") {
      setPhase("success");
      const timer = window.setTimeout(() => {
        router.replace("/dashboard/github");
      }, 1500);
      return () => window.clearTimeout(timer);
    }
  }, [connectionStatus, phase, router]);

  if (phase === "verifying" || isLoading) {
    return (
      <div className="callback-card" role="status" aria-live="polite">
        <div className="callback-icon loading">
          <Loader2 size={24} className="spin" aria-hidden />
        </div>
        <h1>Connecting GitHub…</h1>
        <p>Verifying your installation with the backend. This only takes a moment.</p>
      </div>
    );
  }

  if (phase === "syncing") {
    return (
      <div className="callback-card" role="status" aria-live="polite">
        <div className="callback-icon loading">
          <Loader2 size={24} className="spin" aria-hidden />
        </div>
        <h1>GitHub connected</h1>
        <p>Syncing repositories…</p>
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
        <p>PR Sentinel is now linked to your GitHub account.</p>
        <div className="callback-detail">
          <div className="callback-detail-row">
            <span>Installation</span>
            <strong>{accountLogin ? `@${accountLogin}` : "Active"}</strong>
          </div>
          <div className="callback-detail-row">
            <span>Repositories</span>
            <strong>{repoCount} connected</strong>
          </div>
        </div>
        <div className="callback-actions">
          <button
            className="primary-button"
            onClick={() => router.replace("/dashboard/github")}
          >
            Go to GitHub settings
          </button>
        </div>
      </div>
    );
  }

  const installUrl = getInstallUrl();
  return (
    <div className="callback-card" role="alert">
      <div className="callback-icon error">
        <AlertTriangle size={26} aria-hidden />
      </div>
      <h1>Unable to connect GitHub</h1>
      <p>{errorMsg || "The installation could not be verified."}</p>
      <div className="callback-actions">
        <Link className="primary-button" href="/dashboard/github">
          <GitBranch size={16} />
          Try again
        </Link>
        {installUrl && (
          <a className="secondary-button" href={installUrl}>
            Open GitHub App
          </a>
        )}
        <Link className="secondary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default function InstallationCallbackPage() {
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
        <CallbackContent />
      </Suspense>
    </main>
  );
}
