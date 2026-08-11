"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  logout,
  getStoredUser,
  isAuthenticated,
  getDisplayName,
  getInitials,
} from "@/lib/auth";
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
  return (
    <span className={`status-badge ${tone}`}>
      <span className="status-dot" />
      {risk} risk
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Approved"
      ? "success"
      : status === "Changes requested"
      ? "danger"
      : "warning";
  return <span className={`status-badge ${tone}`}>{status}</span>;
}

export default function PRSentinelDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Overview");
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All risks");
  // Persist theme in localStorage so it survives re-renders and refreshes
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem("pr_sentinel_theme");
    return saved ? saved === "dark" : true;
  });
  const [selectedPr, setSelectedPr] = useState<(typeof pullRequests)[number] | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Track whether we've confirmed auth on the client — avoids SSR false-redirect
  const [authChecked, setAuthChecked] = useState(false);

  const currentUser = useMemo(() => getStoredUser(), []);

  // Guard — only runs client-side after hydration
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/sign-in");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  // Persist theme preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pr_sentinel_theme", isDark ? "dark" : "light");
    }
  }, [isDark]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNav(false);
        setUserMenuOpen(false);
        setSelectedPr(null);
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const displayName = currentUser ? getDisplayName(currentUser) : "User";
  const firstName = displayName.split(/[\s@]+/)[0] || "there";
  const avatarLabel = currentUser ? getInitials(currentUser) : "U";
  const roleLabel = currentUser?.githubId ? "GitHub · OAuth" : "Email · Password";

  async function handleSignOut() {
    await logout();
    router.replace("/sign-in");
  }

  const filteredPrs = useMemo(
    () =>
      pullRequests.filter((pr) => {
        const matchesQuery = `${pr.title} ${pr.repo}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesRisk = riskFilter === "All risks" || pr.risk === riskFilter;
        return matchesQuery && matchesRisk;
      }),
    [query, riskFilter]
  );

  // Don't render the dashboard content until we've confirmed auth client-side
  if (!authChecked) {
    return <div className="route-loading">Loading workspace…</div>;
  }

  return (
    <div className={isDark ? "app-shell" : "app-shell light-mode"}>
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            pr<span>·</span>sentinel
          </span>
          <button
            className="icon-button close-mobile"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          >
            <X />
          </button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">A</div>
          <div className="workspace-copy">
            <strong>Acme Inc.</strong>
            <span>Engineering</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`nav-item ${activeNav === item.label ? "active" : ""}`}
                onClick={() => {
                  setActiveNav(item.label);
                  setMobileNav(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {item.count && <small>{item.count}</small>}
              </button>
            );
          })}
          <p className="nav-label nav-label-spaced">Manage</p>
          <button
            className={`nav-item ${activeNav === "Activity" ? "active" : ""}`}
            onClick={() => setActiveNav("Activity")}
          >
            <Activity size={17} />
            <span>Activity</span>
          </button>
          <button
            className={`nav-item ${activeNav === "Settings" ? "active" : ""}`}
            onClick={() => setActiveNav("Settings")}
          >
            <Settings2 size={17} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="health-card">
            <div className="health-title">
              <span className="pulse-dot" />
              All systems operational
            </div>
            <span>Last checked 2m ago</span>
          </div>
          <div className="user-row">
            <div className="user-avatar">{avatarLabel}</div>
            <div className="user-copy">
              <strong>{displayName}</strong>
              <span>{roleLabel}</span>
            </div>
            {/* Three-dot opens a small menu — does NOT sign the user out */}
            <div className="user-menu-wrap">
              <button
                className="icon-button"
                aria-label="User menu"
                title="User menu"
                onClick={() => setUserMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={18} />
              </button>
              {userMenuOpen && (
                <div
                  className="user-menu"
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    right: 0,
                    background: "var(--surface-2, #1e1e2e)",
                    border: "1px solid var(--border, #2e2e3e)",
                    borderRadius: 8,
                    padding: "4px 0",
                    minWidth: 140,
                    zIndex: 100,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                  }}
                >
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 14px",
                      background: "none",
                      border: "none",
                      color: "var(--text-danger, #f87171)",
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                    }}
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Open navigation"
            onClick={() => setMobileNav(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-separator">/</span>
            <strong>{activeNav}</strong>
          </div>
          <div className="topbar-actions">
            <div className="search-command">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search PRs…"
                aria-label="Search pull requests"
              />
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={17} />
              <span className="notification-dot" />
            </button>
            <button
              className="icon-button"
              aria-label="Toggle theme"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                OVERVIEW
              </div>
              <h1>
                Good morning, {firstName} <span className="wave">✦</span>
              </h1>
              <p>Here&apos;s what&apos;s happening across your repositories.</p>
            </div>
            <button className="primary-button" onClick={() => setActiveNav("Pull requests")}>
              <GitPullRequest size={16} />
              View all pull requests
            </button>
          </section>

          <section className="stats-grid" aria-label="Workspace metrics">
            <article className="stat-card">
              <div className="stat-head"><span>Open pull requests</span><GitPullRequest size={16} /></div>
              <div className="stat-value">24</div>
              <div className="stat-foot positive"><ArrowUpRight size={14} />12.5% <span>vs last week</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-head"><span>Avg. review time</span><Clock3 size={16} /></div>
              <div className="stat-value">4h 12m</div>
              <div className="stat-foot positive"><ArrowDownRight size={14} />8.2% <span>vs last week</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-head"><span>Risk score</span><ShieldCheck size={16} /></div>
              <div className="stat-value">32<span className="stat-unit">/100</span></div>
              <div className="stat-foot positive"><ArrowDownRight size={14} />4.8% <span>vs last week</span></div>
            </article>
            <article className="stat-card">
              <div className="stat-head"><span>Review coverage</span><CircleDot size={16} /></div>
              <div className="stat-value">86<span className="stat-unit">%</span></div>
              <div className="stat-foot positive"><ArrowUpRight size={14} />3.1% <span>vs last week</span></div>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel activity-panel">
              <div className="panel-header">
                <div><h2>Review activity</h2><p>Pull request volume and review velocity</p></div>
                <button className="select-button">Last 7 days <ChevronDown size={14} /></button>
              </div>
              <div className="chart-wrap">
                <div className="chart-y"><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span></div>
                <div className="chart-area">
                  <div className="chart-gridlines"><i /><i /><i /><i /><i /></div>
                  <div className="bars">
                    {[23, 31, 27, 38, 28, 35, 24].map((height, i) => (
                      <div className="bar-group" key={i}>
                        <div className="bar-stack">
                          <span className="bar-primary" style={{ height: `${height * 2.05}px` }} />
                          <span className="bar-secondary" style={{ height: `${height * 0.6}px` }} />
                        </div>
                        <small>{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i]}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="chart-legend">
                <span><i className="legend-primary" />Opened</span>
                <span><i className="legend-secondary" />Merged</span>
                <strong><span className="legend-live" />Live data</strong>
              </div>
            </article>

            <article className="panel recent-panel">
              <div className="panel-header">
                <div><h2>Recent activity</h2><p>Latest workspace events</p></div>
                <button className="text-button">View all <ArrowUpRight size={14} /></button>
              </div>
              <div className="activity-list">
                {activities.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div className="activity-item" key={a.title}>
                      <div className={`activity-icon ${a.tone}`}><Icon size={15} /></div>
                      <div className="activity-copy"><strong>{a.title}</strong><span>{a.detail}</span></div>
                      <time>{a.time}</time>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>

          <section className="panel prs-panel">
            <div className="panel-header prs-header">
              <div><h2>Pull requests</h2><p>Prioritized by review risk and urgency</p></div>
              <div className="filter-row">
                <div className="filter-search">
                  <Search size={14} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter pull requests" />
                </div>
                <button className="filter-button"><SlidersHorizontal size={14} />Filters</button>
              </div>
            </div>
            <div className="table-toolbar">
              <div className="filter-pills">
                {["All risks", "High", "Medium", "Low"].map((f) => (
                  <button key={f} className={riskFilter === f ? "selected" : ""} onClick={() => setRiskFilter(f)}>{f}</button>
                ))}
              </div>
              <span className="results-count">{filteredPrs.length} of {pullRequests.length} pull requests</span>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Pull request</th><th>Repository</th><th>Review status</th><th>Risk</th><th>Score</th><th /></tr>
                </thead>
                <tbody>
                  {filteredPrs.map((pr) => (
                    <tr
                      key={pr.id}
                      tabIndex={0}
                      onClick={() => setSelectedPr(pr)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPr(pr);
                        }
                      }}
                      aria-label={`Open ${pr.id} ${pr.title}`}
                    >
                      <td>
                        <div className="pr-title">
                          <span className="pr-id">{pr.id}</span>
                          <strong>{pr.title}</strong>
                          <span className="pr-meta">{pr.author} · {pr.time} · {pr.files} files</span>
                        </div>
                      </td>
                      <td><span className="repo-name"><span className={`repo-dot ${pr.color}`} />{pr.repo}</span></td>
                      <td><StatusBadge status={pr.status} /></td>
                      <td><RiskBadge risk={pr.risk} /></td>
                      <td><span className={`score ${pr.risk.toLowerCase()}`}>{pr.score}</span></td>
                      <td><MoreHorizontal size={17} className="row-more" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPrs.length === 0 && (
                <div className="empty-state">
                  <Search size={24} />
                  <strong>No pull requests found</strong>
                  <span>Try a different search or risk filter.</span>
                </div>
              )}
            </div>
          </section>

          <footer className="page-footer">
            <span>PR Sentinel <strong>v0.1.0</strong></span>
            <span>Synced moments ago</span>
            <span className="footer-links"><BookOpen size={14} />Docs <Terminal size={14} />API status</span>
          </footer>
        </div>
      </main>

      {selectedPr && (
        <div className="drawer-backdrop" onClick={() => setSelectedPr(null)}>
          <aside className="pr-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className="drawer-kicker">PULL REQUEST {selectedPr.id}</span>
                <h2>{selectedPr.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedPr(null)} aria-label="Close"><X size={18} /></button>
            </div>
            <div className="drawer-repo">
              <span className={`repo-dot ${selectedPr.color}`} />
              {selectedPr.repo}<span>·</span>{selectedPr.time}
            </div>
            <div className="drawer-score">
              <div><span>Risk score</span><strong>{selectedPr.score}<small>/100</small></strong></div>
              <RiskBadge risk={selectedPr.risk} />
            </div>
            <div className="drawer-section">
              <span className="drawer-label">Review summary</span>
              <p>This change touches authentication and request handling paths. Review the rate limit fallback behavior and confirm errors do not expose internal headers.</p>
            </div>
            <div className="drawer-section">
              <span className="drawer-label">Checks</span>
              <div className="check-row"><Check size={15} />Build and typecheck<span>Passed</span></div>
              <div className="check-row"><Check size={15} />Security scan<span>Passed</span></div>
              <div className="check-row warning"><AlertTriangle size={15} />Review coverage<span>Needs attention</span></div>
            </div>
            <button
              className="primary-button drawer-button"
              onClick={() => router.push(`/dashboard/pull-requests/${selectedPr.id.slice(1)}`)}
            >
              <GitPullRequest size={16} />Open review workspace
            </button>
            <button className="github-button drawer-github-button" onClick={() => setSelectedPr(null)}>
              <GitBranch size={16} />Open in GitHub
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
