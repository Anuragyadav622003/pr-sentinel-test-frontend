"use client";

import { type FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  LockKeyhole,
  Mail,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { login, register, startGitHubOAuth } from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";

// ─── Onboarding steps shown on the left panel ─────────────────────────────────

const JOURNEY_STEPS = [
  { icon: GitBranch, label: "Connect GitHub",         desc: "Install the PR Sentinel app on your repos." },
  { icon: Search,    label: "Automatic PR detection", desc: "Every pull request is picked up instantly." },
  { icon: Sparkles,  label: "AI-powered review",      desc: "Findings, risk score, and summary in seconds." },
  { icon: Shield,    label: "Ship with confidence",   desc: "Critical issues flagged before they hit main." },
];

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const email    = (form.elements.namedItem("email")    as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    if (!email || !password) { setError("Email and password are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      if (isSignUp) await register(email, password);
      else          await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      {/* ── Left: value proposition ── */}
      <section className="auth-visual" aria-label="Product overview">
        <div className="auth-brand">
          <span className="brand-mark">
            <Sparkles size={15} strokeWidth={2.5} />
          </span>
          pr<em>·</em>sentinel
        </div>

        <div className="auth-headline">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            AI CODE REVIEW
          </div>
          <h1>Ship with confidence,<br />not guesswork.</h1>
          <p>
            Risk-aware pull request reviews for teams that care about the code
            behind every deploy.
          </p>
        </div>

        <div className="auth-steps" aria-label="How it works">
          {JOURNEY_STEPS.map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="auth-step">
              <div className="auth-step-dot" aria-hidden>
                <Icon size={13} />
              </div>
              <div>
                <strong style={{ display: "block", color: "var(--text)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  {label}
                </strong>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Right: auth form ── */}
      <section className="auth-panel" aria-label={isSignUp ? "Create account" : "Sign in"}>
        <div className="auth-panel-inner">
          {/* Mobile brand */}
          <div
            className="auth-brand"
            style={{ marginBottom: "var(--sp-8)", display: "none" }}
            aria-hidden
          >
            <span className="brand-mark">
              <Sparkles size={14} />
            </span>
            pr<em>·</em>sentinel
          </div>

          <div className="auth-heading">
            <span
              style={{
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                letterSpacing: ".13em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              {isSignUp ? "GET STARTED" : "WELCOME BACK"}
            </span>
            <h2>{isSignUp ? "Create your account" : "Sign in to your workspace"}</h2>
            <p>
              {isSignUp
                ? "Continue with GitHub for the fastest setup, or use your email."
                : "Continue with GitHub or sign in with email and password."}
            </p>
          </div>

          {/* GitHub OAuth — primary CTA */}
          <button
            type="button"
            className="github-btn"
            onClick={() => startGitHubOAuth()}
            aria-label="Continue with GitHub"
          >
            <GitBranch size={17} aria-hidden />
            Continue with GitHub
          </button>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          {/* Email / password form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <Mail size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} aria-hidden />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete={isSignUp ? "email" : "username"}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <LockKeyhole size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} aria-hidden />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
            >
              {loading
                ? "Please wait…"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
              {!loading && <ArrowRight size={15} aria-hidden />}
            </button>
          </form>

          <p className="auth-switch">
            {isSignUp ? "Already have an account? " : "New to PR Sentinel? "}
            <a href={isSignUp ? "/sign-in" : "/sign-up"}>
              {isSignUp ? "Sign in" : "Create an account"}
            </a>
          </p>

          {/* Trust signal */}
          <div
            style={{
              marginTop: "var(--sp-8)",
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-2)",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-xs)",
            }}
          >
            <CheckCircle2 size={13} style={{ color: "var(--success)", flexShrink: 0 }} aria-hidden />
            Your API keys are encrypted at rest and never logged.
          </div>
        </div>
      </section>
    </main>
  );
}
