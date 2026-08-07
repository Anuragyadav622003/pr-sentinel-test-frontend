"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, GitBranch, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { startDemoSession } from "@/lib/demo-auth";

type AuthMode = "sign-in" | "sign-up";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    window.setTimeout(() => {
      startDemoSession();
      router.push("/dashboard");
    }, 350);
  }

  function handleGitBranch() {
    setError("GitHub OAuth is ready for API integration. Demo mode will continue with Jordan Davis.");
    startDemoSession();
    window.setTimeout(() => router.push("/dashboard"), 450);
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand"><span className="brand-mark"><Sparkles size={16} /></span><span>pr<span>·</span>sentinel</span></div>
        <div className="auth-visual-copy"><span className="eyebrow"><span className="eyebrow-line" />ENGINEERING INTELLIGENCE</span><h1>Ship with confidence, not guesswork.</h1><p>Risk-aware pull request reviews for teams that care about the code behind every deploy.</p></div>
        <div className="auth-signal"><div><span className="pulse-dot" />Live review signal</div><strong>86<span>%</span></strong><small>of changes reviewed before merge</small></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand"><span className="brand-mark"><Sparkles size={16} /></span>pr<span>·</span>sentinel</div>
          <div className="auth-heading"><span className="drawer-kicker">{isSignUp ? "CREATE WORKSPACE ACCESS" : "WELCOME BACK"}</span><h2>{isSignUp ? "Start reviewing smarter." : "Sign in to your workspace."}</h2><p>{isSignUp ? "Create a demo workspace now. Connect your API when you are ready." : "Use the demo account to explore the full PR Sentinel experience."}</p></div>
          <button className="github-button" type="button" onClick={handleGitBranch}><GitBranch size={17} />Continue with GitHub <span className="api-ready">API ready</span></button>
          <div className="auth-divider"><span>or use email</span></div>
          <form className="auth-form" onSubmit={handleSubmit}>
            {isSignUp && <label><span>Name</span><div className="auth-input"><UserRound size={15} /><input name="name" placeholder="Jordan Davis" required /></div></label>}
            <label><span>Email address</span><div className="auth-input"><Mail size={15} /><input name="email" type="email" placeholder="jordan@acme.dev" required /></div></label>
            <label><span>Password</span><div className="auth-input"><LockKeyhole size={15} /><input name="password" type="password" placeholder="••••••••" minLength={6} required /></div></label>
            {isSignUp && <label className="auth-check"><input type="checkbox" required /><span>I agree to the demo workspace terms</span></label>}
            {error && <p className="auth-note">{error}</p>}
            <button className="primary-button auth-submit" disabled={isSubmitting}>{isSubmitting ? "Opening workspace..." : isSignUp ? "Create demo workspace" : "Sign in to dashboard"}<ArrowRight size={16} /></button>
          </form>
          <p className="auth-switch">{isSignUp ? "Already have access?" : "New to PR Sentinel?"} <a href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</a></p>
          <p className="auth-footnote">Demo mode · API integrations can be connected later from Settings.</p>
        </div>
      </section>
    </main>
  );
}
