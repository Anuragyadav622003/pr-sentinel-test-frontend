"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, CheckCircle2, ChevronRight, Code2, GitPullRequest, KeyRound, LayoutDashboard, LogOut, Menu, Save, Settings2, ShieldCheck, Sparkles, TestTube2, X } from "lucide-react";
import { getDisplayName, getInitials, getStoredUser, logout } from "@/lib/auth";

const nav = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["Pull requests", "/dashboard/pull-requests", GitPullRequest],
  ["Findings", "/dashboard/findings", ShieldCheck],
  ["Repositories", "/dashboard/repositories", Code2],
  ["Activity", "/dashboard/activity", Activity],
  ["Settings", "/dashboard/settings", Settings2],
] as const;

type Kind = "pull-requests" | "findings" | "repositories" | "activity" | "settings";

function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return <div className="workspace-empty"><div className="empty-icon"><Sparkles size={18} /></div><h2>{title}</h2><p>{body}</p>{action && <button className="primary-button" onClick={onAction}>{action}<ChevronRight size={15} /></button>}</div>;
}
function Header({ eyebrow, title, body, action, onAction }: { eyebrow: string; title: string; body: string; action?: string; onAction?: () => void }) {
  return <header className="workspace-page-header"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{body}</p></div>{action && <button className="primary-button" onClick={onAction}>{action}<ChevronRight size={15} /></button>}</header>;
}
function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter(); const path = usePathname(); const [mobile, setMobile] = useState(false); const [menu, setMenu] = useState(false); const user = getStoredUser();
  const name = user ? getDisplayName(user) : "Workspace member";
  return <div className="app-shell"><aside className={`sidebar ${mobile ? "sidebar-open" : ""}`}><div className="brand-row"><div className="brand-mark"><Sparkles size={16} /></div><span className="brand-name">pr<span>·</span>sentinel</span><button className="icon-button close-mobile" onClick={() => setMobile(false)} aria-label="Close navigation"><X /></button></div><div className="workspace-switcher"><div className="workspace-avatar">W</div><div className="workspace-copy"><strong>Workspace</strong><span>GitHub not connected</span></div></div><nav className="nav-list" aria-label="Workspace navigation"><p className="nav-label">Workspace</p>{nav.map(([label, href, Icon]) => <button key={href} className={`nav-item ${path === href || (href !== "/dashboard" && path.startsWith(href)) ? "active" : ""}`} onClick={() => { router.push(href); setMobile(false); }}><Icon size={17} /><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><div className="health-card"><div className="health-title"><span className="pulse-dot" />Connection required</div><span>Connect GitHub to enable monitoring</span></div><div className="user-row"><div className="user-avatar">{user ? getInitials(user) : "U"}</div><div className="user-copy"><strong>{name}</strong><span>{user?.githubId ? "GitHub · OAuth" : "Account"}</span></div><button className="icon-button" onClick={() => setMenu(!menu)} aria-label="Account menu"><Menu size={17} /></button>{menu && <button className="account-popover" onClick={async () => { await logout(); router.replace("/sign-in"); }}><LogOut size={14} />Sign out</button>}</div></div></aside><main className="main-content"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobile(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{title}</strong></div><div className="topbar-actions"><div className="live-indicator"><span className="pulse-dot" />Operational</div></div></header>{children}</main></div>;
}

function AiSettings() {
  const [mode, setMode] = useState<"free" | "byok">("free");
  const [provider, setProvider] = useState("OpenRouter");
  const [saved, setSaved] = useState(false);
  return <div className="ai-settings-layout">
    <section className="workspace-panel ai-mode-panel">
      <div className="panel-header"><div><h2>AI review mode</h2><p>Choose how PR Sentinel powers your automated reviews.</p></div><span className="status-badge info">Phase 1 ready</span></div>
      <div className="mode-options">
        <button className={`mode-option ${mode === "free" ? "selected" : ""}`} onClick={() => setMode("free")} aria-pressed={mode === "free"}><span className="radio-dot" /><span><strong>PR Sentinel Free AI</strong><small>Use our managed OpenRouter access with a daily quota.</small></span><span className="mode-tag">5 reviews / day</span></button>
        <button className={`mode-option ${mode === "byok" ? "selected" : ""}`} onClick={() => setMode("byok")} aria-pressed={mode === "byok"}><span className="radio-dot" /><span><strong>Use my own API key</strong><small>Bring your provider key and pay the provider directly.</small></span><span className="mode-tag neutral">BYOK</span></button>
      </div>
    </section>
    <section className="workspace-panel provider-panel">
      <div className="panel-header"><div><h2>{mode === "free" ? "Managed provider" : "Provider configuration"}</h2><p>{mode === "free" ? "Your reviews will run through a free OpenRouter model." : "Store provider credentials securely for private reviews."}</p></div><KeyRound size={18} className="panel-icon" /></div>
      <div className="provider-form">
        <label><span>AI provider</span><select value={provider} onChange={(e) => setProvider(e.target.value)} disabled={mode === "free"}><option>OpenRouter</option><option>OpenAI</option><option>Gemini</option><option>Anthropic</option></select></label>
        <label><span>API key <em>{mode === "free" ? "Managed by PR Sentinel" : "Encrypted at rest"}</em></span><input type="password" placeholder={mode === "free" ? "Managed provider key" : "Paste your provider key"} disabled={mode === "free"} /></label>
        <label><span>Model</span><select defaultValue={mode === "free" ? "Free model · recommended" : "Select a model"}><option>Free model · recommended</option><option>openai/gpt-4o-mini</option><option>google/gemini-2.0-flash</option><option>anthropic/claude-3-5-haiku</option></select></label>
      </div>
      <div className="provider-actions"><button className="secondary-button" type="button"><TestTube2 size={15} />Test connection</button><button className="primary-button" type="button" onClick={() => setSaved(true)}><Save size={15} />{saved ? "Saved" : "Save configuration"}</button></div>
      <div className="security-note"><ShieldCheck size={15} /><span>API keys are never exposed to the browser, review records, or job payloads.</span></div>
    </section>
    <section className="workspace-panel quota-panel"><div className="quota-heading"><div><p className="eyebrow">USAGE</p><h2>Free AI allowance</h2></div><strong>0 <small>/ 5 reviews today</small></strong></div><div className="quota-track"><span /></div><p>Resets daily at midnight UTC. Upgrade to BYOK when you need more capacity.</p></section>
  </div>;
}

function Page({ kind }: { kind: Kind }) {
  const [connected, setConnected] = useState(false);
  const configs = { "pull-requests": ["PULL REQUESTS", "Review queue", "Every pull request entering your configured review workflow."], findings: ["FINDINGS", "Security findings", "Review issues detected across completed pull request reviews."], repositories: ["REPOSITORIES", "Repository setup", "Choose which GitHub repositories PR Sentinel can review."], activity: ["ACTIVITY", "Audit activity", "A chronological record of workspace and review events."], settings: ["SETTINGS", "Workspace settings", "Control review policy, notifications, members, and access."] } as const;
  const [eyebrow, title, body] = configs[kind];
  if (kind === "settings") return <Shell title={title}><div className="content-wrap workspace-content"><Header eyebrow={eyebrow} title={title} body={body} /><AiSettings /></div></Shell>;
  return <Shell title={title}><div className="content-wrap workspace-content"><Header eyebrow={eyebrow} title={title} body={body} action={kind === "repositories" && !connected ? "Connect GitHub" : undefined} onAction={() => setConnected(true)} /><section className="workspace-panel"><div className="panel-header"><div><h2>{kind === "repositories" ? "Connected repositories" : kind === "activity" ? "Event history" : kind === "findings" ? "All findings" : "Pull requests"}</h2><p>{connected ? "Connection setup started." : "No live workspace data is available yet."}</p></div><span className="status-badge warning">Connection required</span></div><EmptyState title={connected ? "GitHub connection pending" : kind === "repositories" ? "No repositories connected" : `No ${kind.replace("-", " ")} yet`} body="Connect GitHub and configure a workspace before production data can appear here. PR Sentinel never displays sample records." action={kind === "repositories" && !connected ? "Start repository setup" : undefined} onAction={() => setConnected(true)} /></section></div></Shell>;
}

export default function WorkspacePage({ kind }: { kind: Kind }) { return <Page kind={kind} />; }
