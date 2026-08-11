"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, CheckCircle2, ChevronRight, Code2, GitPullRequest, LayoutDashboard, LogOut, Menu, Settings2, ShieldCheck, Sparkles, X } from "lucide-react";
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

function Page({ kind }: { kind: Kind }) {
  const [connected, setConnected] = useState(false);
  const configs = { "pull-requests": ["PULL REQUESTS", "Review queue", "Every pull request entering your configured review workflow."], findings: ["FINDINGS", "Security findings", "Review issues detected across completed pull request reviews."], repositories: ["REPOSITORIES", "Repository setup", "Choose which GitHub repositories PR Sentinel can review."], activity: ["ACTIVITY", "Audit activity", "A chronological record of workspace and review events."], settings: ["SETTINGS", "Workspace settings", "Control review policy, notifications, members, and access."] } as const;
  const [eyebrow, title, body] = configs[kind];
  return <Shell title={title}><div className="content-wrap workspace-content"><Header eyebrow={eyebrow} title={title} body={body} action={kind === "repositories" && !connected ? "Connect GitHub" : undefined} onAction={() => setConnected(true)} /><section className="workspace-panel"><div className="panel-header"><div><h2>{kind === "repositories" ? "Connected repositories" : kind === "settings" ? "Configuration" : kind === "activity" ? "Event history" : kind === "findings" ? "All findings" : "Pull requests"}</h2><p>{connected ? "Connection setup started." : "No live workspace data is available yet."}</p></div><span className="status-badge warning">Connection required</span></div><EmptyState title={connected ? "GitHub connection pending" : kind === "repositories" ? "No repositories connected" : `No ${kind.replace("-", " ")} yet`} body="Connect GitHub and configure a workspace before production data can appear here. PR Sentinel never displays sample records." action={kind === "repositories" && !connected ? "Start repository setup" : undefined} onAction={() => setConnected(true)} /></section>{kind === "settings" && <section className="workspace-panel"><div className="setting-row"><span><strong>Review policy</strong><small>Available after a repository is connected.</small></span><input type="checkbox" disabled /></div><div className="setting-row"><span><strong>Notifications</strong><small>Available after workspace setup.</small></span><input type="checkbox" disabled /></div></section>}</div></Shell>;
}

export default function WorkspacePage({ kind }: { kind: Kind }) { return <Page kind={kind} />; }
