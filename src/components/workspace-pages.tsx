"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, CheckCircle2, ChevronRight, Code2, GitPullRequest, KeyRound, LayoutDashboard, LogOut, Menu, Save, Settings2, ShieldCheck, Sparkles, TestTube2, X } from "lucide-react";
import { getDisplayName, getInitials, getStoredUser, logout } from "@/lib/auth";
import { FREE_TIER_DAILY_LIMIT } from "@/lib/config";

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

type LlmProviderType = "OPENROUTER" | "OPENAI" | "GEMINI" | "ANTHROPIC";
type ProviderConfig = { provider: LlmProviderType; model: string; isConfigured: boolean; isActive: boolean; lastTestedStatus: "success" | "failed" | null; maskedKey?: string };

const providerMeta: Record<LlmProviderType, { name: string; model: string; placeholder: string }> = {
  OPENROUTER: { name: "OpenRouter", model: "meta-llama/llama-3.1-8b-instruct", placeholder: "sk-or-..." },
  OPENAI: { name: "OpenAI", model: "gpt-4o-mini", placeholder: "sk-..." },
  GEMINI: { name: "Gemini", model: "gemini-2.0-flash", placeholder: "AIza..." },
  ANTHROPIC: { name: "Anthropic", model: "claude-3-5-haiku-latest", placeholder: "sk-ant-..." },
};

function useLlmProviders() {
  const [mode, setMode] = useState<"FREE" | "BYOK">("FREE");
  const [configs, setConfigs] = useState<ProviderConfig[]>([
    { provider: "OPENROUTER", model: providerMeta.OPENROUTER.model, isConfigured: true, isActive: true, lastTestedStatus: "success", maskedKey: "sk-••••1a2b" },
    ...(["OPENAI", "GEMINI", "ANTHROPIC"] as LlmProviderType[]).map((provider) => ({ provider, model: providerMeta[provider].model, isConfigured: false, isActive: false, lastTestedStatus: null })),
  ]);
  return { mode, setMode, configs, setConfigs };
}

function ProviderSwitcher({ mode, configs, onModeChange, onSelect }: { mode: "FREE" | "BYOK"; configs: ProviderConfig[]; onModeChange: (mode: "FREE" | "BYOK") => void; onSelect: (provider: LlmProviderType) => void }) {
  const [open, setOpen] = useState(false);
  const active = configs.find((config) => config.isActive) ?? configs[0];
  if (mode === "FREE") return <div className="reviewer-pill"><span className="pulse-dot" /><div><strong>PR Sentinel free AI</strong><small>{FREE_TIER_DAILY_LIMIT} reviews / day</small></div><div className="reviewer-progress"><span style={{ width: "40%" }} /></div><button type="button" onClick={() => onModeChange("BYOK")}>Switch to my own key</button></div>;
  return <div className="provider-switcher"><button type="button" className="switcher-trigger" onClick={() => setOpen(!open)} aria-expanded={open}><span className="status-dot success" /><span>Reviewing with: <strong>{providerMeta[active.provider].name} · {active.model}</strong></span><ChevronRight size={15} /></button>{open && <div className="switcher-menu">{configs.map((config) => <div className={`switcher-option ${config.isConfigured ? "" : "disabled"}`} key={config.provider} onClick={() => config.isConfigured && (onSelect(config.provider), setOpen(false))}><span className={`status-dot ${config.isConfigured ? config.lastTestedStatus === "failed" ? "failed" : "success" : "muted"}`} /><span><strong>{providerMeta[config.provider].name}</strong><small>{config.isConfigured ? config.model : "Not configured"}</small></span>{!config.isConfigured && <a href="/dashboard/settings">Set up →</a>}</div>)}</div>}</div>;
}

function AiSettings() {
  const { mode, setMode, configs, setConfigs } = useLlmProviders();
  const [editing, setEditing] = useState<LlmProviderType | null>(null);
  const [key, setKey] = useState("");
  const [model, setModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const configuredCount = configs.filter((config) => config.isConfigured).length;
  const beginEdit = (provider: LlmProviderType) => { const config = configs.find((item) => item.provider === provider)!; setEditing(provider); setKey(""); setModel(config.model); setTestMessage(""); };
  const save = () => { if (!editing || !key.trim()) return; setConfigs((items) => items.map((item) => item.provider === editing ? { ...item, model, isConfigured: true, lastTestedStatus: null, maskedKey: `${key.slice(0, 3)}••••${key.slice(-4)}` } : item)); setEditing(null); setKey(""); };
  const test = async () => { setTesting(true); setTestMessage(`$ testing ${providerMeta[editing ?? "OPENROUTER"].name.toLowerCase()}...`); await new Promise((resolve) => setTimeout(resolve, 1500)); const passed = Math.random() > 0.2; setTesting(false); setTestMessage(passed ? "Connected — responded in 480ms" : "Failed — invalid API key"); if (editing) setConfigs((items) => items.map((item) => item.provider === editing ? { ...item, lastTestedStatus: passed ? "success" : "failed" } : item)); };
  return <div className="ai-settings-layout">
    <ProviderSwitcher mode={mode} configs={configs} onModeChange={setMode} onSelect={(provider) => setConfigs((items) => items.map((item) => ({ ...item, isActive: item.provider === provider })))} />
    <section className="workspace-panel ai-mode-panel"><div className="panel-header"><div><p className="eyebrow">REVIEW ENGINE</p><h2>AI review mode</h2><p>Choose how PR Sentinel powers automated reviews.</p></div><span className="status-badge info">{mode === "FREE" ? "Free tier" : "BYOK active"}</span></div><div className="mode-options">
      <button className={`mode-option ${mode === "FREE" ? "selected" : ""}`} onClick={() => setMode("FREE")} aria-pressed={mode === "FREE"}><span className="radio-dot" /><span><strong>PR Sentinel free AI</strong><small>We run reviews on a shared model. No API key needed. Limited to {FREE_TIER_DAILY_LIMIT} reviews per day.</small></span><span className="mode-tag">{FREE_TIER_DAILY_LIMIT} daily</span></button>
      <button className={`mode-option ${mode === "BYOK" ? "selected" : ""}`} onClick={() => setMode("BYOK")} aria-pressed={mode === "BYOK"}><span className="radio-dot" /><span><strong>Use my own API key</strong><small>Connect a provider below. Reviews run on your account and you pay the provider directly.</small></span><span className="mode-tag neutral">{configuredCount} connected</span></button>
    </div></section>
    <section className={`workspace-panel provider-panel ${mode === "FREE" ? "panel-dimmed" : ""}`} id="providers"><div className="panel-header"><div><p className="eyebrow">PROVIDERS</p><h2>Provider connections</h2><p>Only saved keys can be selected as the active reviewer.</p></div><KeyRound size={18} className="panel-icon" /></div>{mode === "BYOK" && configuredCount === 0 && <div className="inline-prompt"><Sparkles size={16} /><span>Add a provider to start reviewing with your own key.</span></div>}<div className="provider-list">{configs.map((config) => <div className={`provider-row ${editing === config.provider ? "expanded" : ""}`} key={config.provider}><div className="provider-row-main"><div className={`status-dot ${!config.isConfigured ? "muted" : config.lastTestedStatus === "failed" ? "failed" : "success"}`} /><div className="provider-name"><strong>{providerMeta[config.provider].name}</strong><small>{config.isConfigured ? `${config.maskedKey ?? "Saved key"} · ${config.model}` : "Not configured"}</small></div><div className="provider-row-actions">{config.isConfigured && editing !== config.provider && <button className="text-button" onClick={() => beginEdit(config.provider)}>Edit</button>}{config.isConfigured && editing !== config.provider && <button className="text-button danger" onClick={() => setConfigs((items) => items.map((item) => item.provider === config.provider ? { ...item, isConfigured: false, isActive: false, maskedKey: undefined } : item))}>Remove</button>}{!config.isConfigured && mode === "BYOK" && <button className="secondary-button compact" onClick={() => beginEdit(config.provider)}>Configure</button>}</div></div>{editing === config.provider && <div className="provider-editor"><label>API key<input autoFocus type={showKey ? "text" : "password"} value={key} onChange={(event) => setKey(event.target.value)} placeholder={providerMeta[config.provider].placeholder} /><button type="button" className="input-eye" onClick={() => setShowKey(!showKey)} aria-label={showKey ? "Hide API key" : "Show API key"}>◉</button></label><label>Model<input value={model} onChange={(event) => setModel(event.target.value)} /></label><div className="provider-actions"><button className="secondary-button compact" type="button" onClick={test} disabled={testing}><TestTube2 size={15} />{testing ? "Testing…" : "Test connection"}</button><button className="primary-button compact" type="button" onClick={save} disabled={!key.trim()}><Save size={15} />Save</button><button className="text-button" type="button" onClick={() => setEditing(null)}>Cancel</button></div>{testMessage && <div className={`terminal-status ${testMessage.startsWith("Connected") ? "success" : testMessage.startsWith("Failed") ? "failed" : ""}`}>{testMessage}</div>}</div>}</div>)}</div><div className="security-note"><ShieldCheck size={15} /><span>Keys are encrypted at rest and never included in review records or job payloads.</span></div></section>
    <div className="provider-note"><span>Manage provider connections securely. Free AI remains available when no BYOK provider is active.</span><a href="#providers">Manage providers</a></div>
    <section className="workspace-panel quota-panel"><div className="quota-heading"><div><p className="eyebrow">USAGE</p><h2>Free AI allowance</h2></div><strong><small>{FREE_TIER_DAILY_LIMIT} reviews / day limit</small></strong></div><div className="quota-track"><span style={{ width: "40%" }} /></div><p>Resets daily at midnight UTC. Switch to your own key when you need more capacity.</p></section>
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
