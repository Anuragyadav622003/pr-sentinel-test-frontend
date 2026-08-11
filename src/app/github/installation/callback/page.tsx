"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Github, Loader2 } from "lucide-react";
import { githubApi, getInstallUrl } from "@/lib/api/github";
import type { GitHubInstallationStatus } from "@/lib/api/types";

type Phase = "verifying" | "success" | "error";

function CallbackContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [result, setResult] = useState<GitHubInstallationStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const ran = useRef(false);

  useEffect(() => {
    // GitHub may re-render this effect; only verify once.
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

    githubApi
      .verifyInstallation({ installationId, setupAction })
      .then((status) => {
        if (status.connected) {
          setResult(status);
          setPhase("success");
        } else {
          setErrorMsg("The installation could not be verified.");
          setPhase("error");
        }
      })
      .catch((err: unknown) => {
        setErrorMsg(
          err instanceof Error ? err.message : "The installation could not be verified."
        );
        setPhase("error");
      });
  }, [params]);

  if (phase === "verifying") {
    return (
      <div className="callback-card" role="status" aria-live="polite">
        <div className="callback-icon loading">
          <Loader2 size={24} className="spin" aria-hidden />
        </div>
        <h1>Connecting GitHub…</h1>
        <p>Verifying your installation. This only takes a moment.</p>
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
            <strong>
              {result?.installation?.accountLogin
                ? `@${result.installation.accountLogin}`
                : "Active"}
            </strong>
          </div>
          <div className="callback-detail-row">
            <span>Repositories</span>
            <strong>
              {result?.repositoryCount ?? 0} connected
            </strong>
          </div>
        </div>
        <div className="callback-actions">
          <button
            className="primary-button"
            onClick={() => router.replace("/dashboard")}
          >
            Go to dashboard
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
        {installUrl && (
          <a className="primary-button" href={installUrl}>
            <Github size={16} />
            Try again
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
