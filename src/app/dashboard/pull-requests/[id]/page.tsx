"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, Code2, GitBranch, MessageSquare, Play, ShieldAlert, Sparkles } from "lucide-react";

const diffLines = [
  ["context", "@@ public/api/middleware.ts"],
  ["remove", "- const limit = config.rateLimit"],
  ["add", "+ const limit = await resolveLimit(request)"],
  ["add", "+ if (limit.remaining <= 0) return tooManyRequests()"],
  ["context", "  return next(request)"],
];

export default function PullRequestReviewPage() {
  const router = useRouter();
  return <main className="review-page">
    <header className="review-topbar"><button className="back-button" onClick={() => router.push("/dashboard")}><ArrowLeft size={16} />Back to pull requests</button><div className="review-actions"><button className="review-ghost"><GitBranch size={15} />Open in GitHub</button><button className="primary-button"><Check size={15} />Approve</button></div></header>
    <div className="review-layout">
      <section className="review-main">
        <div className="review-breadcrumb"><span>acme / api-gateway</span><span>/</span><strong>#1842</strong></div>
        <div className="review-title"><div><span className="drawer-kicker">PR #1842 · OPENED 18M AGO</span><h1>Add rate limiting to public API</h1><p>Jordan Davis wants to merge 14 files into <strong>main</strong> from <strong>feature/rate-limits</strong></p></div><span className="status-badge warning">Review needed</span></div>
        <div className="review-tabs"><button className="review-tab active">Overview</button><button className="review-tab">Files changed <span>14</span></button><button className="review-tab">Conversation <span>3</span></button></div>
        <section className="review-card ai-card"><div className="review-card-header"><div className="ai-title"><span className="ai-icon"><Sparkles size={15} /></span><div><h2>LLM review summary</h2><p>Generated from the current diff and repository context</p></div></div><span className="api-ready">API ready</span></div><p className="ai-copy">This change adds request-level rate limiting with a Redis-backed counter. The main risk is the fallback behavior when Redis is unavailable: requests may be allowed through without a bounded retry strategy. Confirm the fallback is intentional before merging.</p><div className="ai-findings"><div><ShieldAlert size={15} /><span>1 high-confidence finding</span></div><div><Check size={15} /><span>6 checks passed</span></div><div><MessageSquare size={15} /><span>3 suggested comments</span></div></div></section>
        <section className="review-card"><div className="review-card-header"><div><h2>Files changed</h2><p>14 files · +228 −41 lines</p></div><button className="review-ghost">View options <ChevronDown size={14} /></button></div><div className="file-row"><Code2 size={15} /><span>public/api/middleware.ts</span><span className="file-stat">+42 −8</span></div><div className="diff-block"><div className="diff-header"><span>public/api/middleware.ts</span><span>TypeScript</span></div>{diffLines.map(([tone, line], index) => <div className={`diff-line ${tone}`} key={index}><span>{index + 38}</span><code>{line}</code></div>)}</div></section>
      </section>
      <aside className="review-sidebar"><section className="review-card"><h2>Risk assessment</h2><div className="risk-score-large"><strong>92</strong><span>/100 high risk</span></div><div className="risk-meter"><span /></div><div className="review-facts"><div><span>Changed files</span><strong>14</strong></div><div><span>Reviewers</span><strong>2 / 3</strong></div><div><span>Checks</span><strong className="positive">6 passed</strong></div></div></section><section className="review-card"><div className="review-card-header"><h2>Required checks</h2><button className="icon-button"><Play size={14} /></button></div><div className="check-row"><Check size={15} />Build and typecheck<span>Passed</span></div><div className="check-row"><Check size={15} />Security scan<span>Passed</span></div><div className="check-row warning"><ShieldAlert size={15} />LLM review<span>1 finding</span></div></section></aside>
    </div>
  </main>;
}
