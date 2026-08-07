"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { endDemoSession, isDemoAuthenticated } from "@/lib/demo-auth";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Code2,
  GitPullRequest,
  GitBranch,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  X,
} from "lucide-react";

const pullRequests = [
  { id: "#1842", title: "Add rate limiting to public API", repo: "acme/api-gateway", author: "JD", time: "18m ago", status: "Review needed", risk: "High", score: 92, files: 14, comments: 3, color: "violet" },
  { id: "#1839", title: "Refactor billing webhook retries", repo: "acme/payments", author: "AL", time: "42m ago", status: "Changes requested", risk: "Medium", score: 67, files: 8, comments: 7, color: "cyan" },
  { id: "#1837", title: "Update node runtime to 22.x", repo: "acme/platform", author: "MK", time: "1h ago", status: "Approved", risk: "Low", score: 18, files: 3, comments: 1, color: "amber" },
  { id: "#1833", title: "Improve checkout empty states", repo: "acme/storefront", author: "SR", time: "2h ago", status: "Review needed", risk: "Medium", score: 54, files: 11, comments: 4, color: "pink" },
  { id: "#1828", title: "Add audit events for team settings", repo: "acme/console", author: "TW", time: "3h ago", status: "Approved", risk: "Low", score: 12, files: 6, comments: 0, color: "emerald" },
];

const activities = [
  { icon: ShieldCheck, title: "Security scan passed", detail: "acme/platform · #1837", time: "12m", tone: "success" },
  { icon: AlertTriangle, title: "Risk score increased", detail: "acme/api-gateway · #1842", time: "18m", tone: "warning" },
  { icon: Check, title: "Review completed", detail: "acme/console · #1828", time: "31m", tone: "success" },
  { icon: GitPullRequest, title: "New pull request opened", detail: "acme/storefront · #1833", time: "2h", tone: "info" },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Pull requests", icon: GitPullRequest, count: "24" },
  { label: "Repositories", icon: Code2, count: "8" },
  { label: "Security", icon: ShieldCheck, count: "3" },
];

function RiskBadge({ risk }: { risk: string }) {
  const tone = risk === "High" ? "danger" : risk === "Medium" ? "warning" : "success";
  return <span className={`status-badge ${tone}`}><span className="status-dot" />{risk} risk</span>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "Approved" ? "success" : status === "Changes requested" ? "danger" : "warning";
  return <span className={`status-badge ${tone}`}>{status}</span>;
}

export default function PRSentinelDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All risks");
  const [isDark, setIsDark] = useState(true);
  const [selectedPr, setSelectedPr] = useState<(typeof pullRequests)[number] | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    if (!isDemoAuthenticated()) router.replace("/sign-in");
  }, [router]);

  const filteredPrs = useMemo(() => pullRequests.filter((pr) => {
    const matchesQuery = `${pr.title} ${pr.repo}`.toLowerCase().includes(query.toLowerCase());
    const matchesRisk = riskFilter === "All risks" || pr.risk === riskFilter;
    return matchesQuery && matchesRisk;
  }), [query, riskFilter]);

  return (
    <div className={isDark ? "app-shell" : "app-shell light-mode"}>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={16} strokeWidth={2.5} /></div>
          <span className="brand-name">pr<span>·</span>sentinel</span>
          <button className="icon-button close-mobile" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X /></button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">A</div>
          <div className="workspace-copy"><strong>Acme Inc.</strong><span>Engineering</span></div>
          <ChevronDown size={15} />
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.label} className={`nav-item ${activeNav === item.label ? "active" : ""}`} onClick={() => { setActiveNav(item.label); setMobileNav(false); }}><Icon size={17} /><span>{item.label}</span>{item.count && <small>{item.count}</small>}</button>;
          })}
          <p className="nav-label nav-label-spaced">Manage</p>
          <button className={`nav-item ${activeNav === "Activity" ? "active" : ""}`} onClick={() => setActiveNav("Activity")}><Activity size={17} /><span>Activity</span></button>
          <button className={`nav-item ${activeNav === "Settings" ? "active" : ""}`} onClick={() => setActiveNav("Settings")}><Settings2 size={17} /><span>Settings</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="health-card"><div className="health-title"><span className="pulse-dot" />All systems operational</div><span>Last checked 2m ago</span></div>
          <div className="user-row"><div className="user-avatar">JD</div><div className="user-copy"><strong>Jordan Davis</strong><span>Admin · Demo</span></div><button className="icon-button" aria-label="Sign out" onClick={() => { endDemoSession(); router.replace("/sign-in"); }}><MoreHorizontal size={18} /></button></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu /></button>
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-separator">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions"><div className="search-command"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search PRs..." aria-label="Search pull requests" /><kbd>⌘ K</kbd></div><button className="icon-button" aria-label="Notifications"><Bell size={17} /><span className="notification-dot" /></button><button className="icon-button" aria-label="Toggle theme" onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
        </header>

        <div className="content-wrap">
          <section className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line" />OVERVIEW</div><h1>Good morning, Jordan <span className="wave">✦</span></h1><p>Here&apos;s what&apos;s happening across your repositories.</p></div><button className="primary-button"><GitPullRequest size={16} />View all pull requests</button></section>

          <section className="stats-grid" aria-label="Workspace metrics">
            <article className="stat-card"><div className="stat-head"><span>Open pull requests</span><GitPullRequest size={16} /></div><div className="stat-value">24</div><div className="stat-foot positive"><ArrowUpRight size={14} />12.5% <span>vs last week</span></div></article>
            <article className="stat-card"><div className="stat-head"><span>Avg. review time</span><Clock3 size={16} /></div><div className="stat-value">4h 12m</div><div className="stat-foot positive"><ArrowDownRight size={14} />8.2% <span>vs last week</span></div></article>
            <article className="stat-card"><div className="stat-head"><span>Risk score</span><ShieldCheck size={16} /></div><div className="stat-value">32<span className="stat-unit">/100</span></div><div className="stat-foot positive"><ArrowDownRight size={14} />4.8% <span>vs last week</span></div></article>
            <article className="stat-card"><div className="stat-head"><span>Review coverage</span><CircleDot size={16} /></div><div className="stat-value">86<span className="stat-unit">%</span></div><div className="stat-foot positive"><ArrowUpRight size={14} />3.1% <span>vs last week</span></div></article>
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel"><div className="panel-header"><div><h2>Review activity</h2><p>Pull request volume and review velocity</p></div><button className="select-button">Last 7 days <ChevronDown size={14} /></button></div><div className="chart-wrap"><div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div><div className="chart-area"><div className="chart-gridlines"><i /><i /><i /><i /><i /></div><div className="bars">{[23, 31, 27, 38, 28, 35, 24].map((height, index) => <div className="bar-group" key={index}><div className="bar-stack"><span className="bar-primary" style={{ height: `${height * 2.05}px` }} /><span className="bar-secondary" style={{ height: `${height * 0.6}px` }} /></div><small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small></div>)}</div></div></div><div className="chart-legend"><span><i className="legend-primary" />Opened</span><span><i className="legend-secondary" />Merged</span><strong><span className="legend-live" />Live data</strong></div></article>
            <article className="panel recent-panel"><div className="panel-header"><div><h2>Recent activity</h2><p>Latest workspace events</p></div><button className="text-button">View all <ArrowUpRight size={14} /></button></div><div className="activity-list">{activities.map((activity) => { const Icon = activity.icon; return <div className="activity-item" key={activity.title}><div className={`activity-icon ${activity.tone}`}><Icon size={15} /></div><div className="activity-copy"><strong>{activity.title}</strong><span>{activity.detail}</span></div><time>{activity.time}</time></div>; })}</div></article>
          </section>

          <section className="panel prs-panel"><div className="panel-header prs-header"><div><h2>Pull requests</h2><p>Prioritized by review risk and urgency</p></div><div className="filter-row"><div className="filter-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter pull requests" /></div><button className="filter-button"><SlidersHorizontal size={14} />Filters</button></div></div><div className="table-toolbar"><div className="filter-pills">{["All risks", "High", "Medium", "Low"].map((filter) => <button key={filter} className={riskFilter === filter ? "selected" : ""} onClick={() => setRiskFilter(filter)}>{filter}</button>)}</div><span className="results-count">{filteredPrs.length} of {pullRequests.length} pull requests</span></div><div className="table-scroll"><table><thead><tr><th>Pull request</th><th>Repository</th><th>Review status</th><th>Risk</th><th>Score</th><th /></tr></thead><tbody>{filteredPrs.map((pr) => <tr key={pr.id} onClick={() => setSelectedPr(pr)}><td><div className="pr-title"><span className="pr-id">{pr.id}</span><strong>{pr.title}</strong><span className="pr-meta">{pr.author} · {pr.time} · {pr.files} files</span></div></td><td><span className="repo-name"><span className={`repo-dot ${pr.color}`} />{pr.repo}</span></td><td><StatusBadge status={pr.status} /></td><td><RiskBadge risk={pr.risk} /></td><td><span className={`score ${pr.risk.toLowerCase()}`}>{pr.score}</span></td><td><MoreHorizontal size={17} className="row-more" /></td></tr>)}</tbody></table>{filteredPrs.length === 0 && <div className="empty-state"><Search size={24} /><strong>No pull requests found</strong><span>Try a different search or risk filter.</span></div>}</div></section>

          <footer className="page-footer"><span>PR Sentinel <strong>v0.1.0</strong></span><span>Synced moments ago</span><span className="footer-links"><BookOpen size={14} />Docs <Terminal size={14} />API status</span></footer>
        </div>
      </main>

      {selectedPr && <div className="drawer-backdrop" onClick={() => setSelectedPr(null)}><aside className="pr-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-header"><div><span className="drawer-kicker">PULL REQUEST {selectedPr.id}</span><h2>{selectedPr.title}</h2></div><button className="icon-button" onClick={() => setSelectedPr(null)} aria-label="Close pull request details"><X size={18} /></button></div><div className="drawer-repo"><span className={`repo-dot ${selectedPr.color}`} />{selectedPr.repo}<span>·</span>{selectedPr.time}</div><div className="drawer-score"><div><span>Risk score</span><strong>{selectedPr.score}<small>/100</small></strong></div><RiskBadge risk={selectedPr.risk} /></div><div className="drawer-section"><span className="drawer-label">Review summary</span><p>This change touches authentication and request handling paths. Review the rate limit fallback behavior and confirm errors do not expose internal headers.</p></div><div className="drawer-section"><span className="drawer-label">Checks</span><div className="check-row"><Check size={15} />Build and typecheck<span>Passed</span></div><div className="check-row"><Check size={15} />Security scan<span>Passed</span></div><div className="check-row warning"><AlertTriangle size={15} />Review coverage<span>Needs attention</span></div></div><button className="primary-button drawer-button" onClick={() => router.push(`/dashboard/pull-requests/${selectedPr.id.slice(1)}`)}><GitPullRequest size={16} />Open review workspace</button><button className="github-button drawer-github-button" onClick={() => setSelectedPr(null)}><GitBranch size={16} />Open in GitHub <span className="api-ready">API ready</span></button></aside></div>}
    </div>
  );
}
