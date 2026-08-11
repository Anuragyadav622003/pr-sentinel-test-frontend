"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  GitBranch,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { login, register, startGitHubOAuth } from "@/lib/auth";

type AuthMode = "sign-in" | "sign-up";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const password = (
      form.elements.namedItem("password") as HTMLInputElement
    ).value;

    // Client-side pre-check (backend validates too, but this avoids a round-trip)
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      {/* ── Left visual panel ── */}
      <section className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark">
            <Sparkles size={16} />
          </span>
          <span>
            pr<span>·</span>sentinel
          </span>
        </div>
        <div className="auth-visual-copy">
          <span className="eyebrow">
            <span className="eyebrow-line" />
            ENGINEERING INTELLIGENCE
          </span>
          <h1>Ship with confidence, not guesswork.</h1>
          <p>
            Risk-aware pull request reviews for teams that care about the code
            behind every deploy.
          </p>
        </div>
        <div className="auth-signal">
          <div>
            <span className="pulse-dot" />
            Workspace readiness
          </div>
          <strong>0<span>%</span></strong>
          <small>Connect GitHub to start reviewing changes</small>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand">
            <span className="brand-mark">
              <Sparkles size={16} />
            </span>
            pr<span>·</span>sentinel
          </div>

          <div className="auth-heading">
            <span className="drawer-kicker">
              {isSignUp ? "CREATE AN ACCOUNT" : "WELCOME BACK"}
            </span>
            <h2>
              {isSignUp ? "Create your account." : "Sign in to your workspace."}
            </h2>
            <p>
              {isSignUp
                ? "Sign up with GitHub or use your email address."
                : "Continue with GitHub or sign in with email."}
            </p>
          </div>

          {/* GitHub OAuth */}
          <button
            className="github-button"
            type="button"
            onClick={() => startGitHubOAuth()}
          >
            <GitBranch size={17} />
            Continue with GitHub
          </button>

          <div className="auth-divider">
            <span>or use email</span>
          </div>

          {/* Email / password form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label>
              <span>Email address</span>
              <div className="auth-input">
                <Mail size={15} />
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete={isSignUp ? "email" : "username"}
                  required
                />
              </div>
            </label>

            <label>
              <span>Password</span>
              <div className="auth-input">
                <LockKeyhole size={15} />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                />
              </div>
            </label>

            {error && (
              <p className="auth-note auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Please wait…"
                : isSignUp
                ? "Create account"
                : "Sign in"}
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-switch">
            {isSignUp ? "Already have an account?" : "New to PR Sentinel?"}{" "}
            <a href={isSignUp ? "/sign-in" : "/sign-up"}>
              {isSignUp ? "Sign in" : "Create an account"}
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
