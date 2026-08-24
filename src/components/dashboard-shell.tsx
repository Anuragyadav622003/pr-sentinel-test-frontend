"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  Code2,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import {
  clearStoredUser,
  getDisplayName,
  getInitials,
  getStoredUser,
  isAuthenticated,
  logout,
  type AuthUser,
} from "@/lib/auth";
import { useGitHubConnection } from "@/lib/store";
import { useAppDispatch } from "@/lib/store/hooks";
import { baseApi } from "@/lib/store/baseApi";
import { resetGitHubState } from "@/lib/store/githubSlice";

// ─── Navigation config ────────────────────────────────────────────────────────

const WORKSPACE_NAV = [
  { label: "Dashboard",     href: "/dashboard",                     icon: LayoutDashboard, exact: true },
  { label: "Repositories",  href: "/dashboard/repositories",        icon: Code2 },
  { label: "Pull Requests", href: "/dashboard/pull-requests",       icon: GitPullRequest },
  { label: "Reviews",       href: "/dashboard/reviews",             icon: ShieldCheck },
  { label: "Activity",      href: "/dashboard/activity",            icon: Activity },
] as const;

const MANAGE_NAV = [
  { label: "GitHub",    href: "/dashboard/github",   icon: GitBranch },
  { label: "Settings",  href: "/dashboard/settings", icon: Settings2 },
] as const;

// ─── Theme hook ───────────────────────────────────────────────────────────────

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("pr_sentinel_theme");
    if (saved) setIsDark(saved === "dark");
  }, []);
  useEffect(() => {
    localStorage.setItem("pr_sentinel_theme", isDark ? "dark" : "light");
  }, [isDark]);
  return { isDark, toggle: () => setIsDark((v) => !v) };
}

// ─── GitHub health indicator ──────────────────────────────────────────────────

function GitHubHealth() {
  const github = useGitHubConnection();

  const dotClass =
    github.isChecking || github.status === "unknown" ? "pending"
    : github.status === "connecting" || github.status === "syncing" ? "warn"
    : github.connected ? "ok"
    : "error";

  const label =
    github.isChecking ? "Checking GitHub…"
    : github.status === "connecting" ? "Connecting…"
    : github.status === "syncing" ? "Syncing repos…"
    : github.connected ? "GitHub connected"
    : "GitHub not connected";

  const sub =
    github.isChecking ? "Verifying installation"
    : github.connected
      ? `${github.repositoriesCount} repositor${github.repositoriesCount === 1 ? "y" : "ies"} monitored`
      : null;

  return (
    <div className="github-health">
      <div className="health-row">
        <span className={`status-dot ${dotClass}`} aria-hidden />
        <span>{label}</span>
      </div>
      {sub && <div className="health-sub">{sub}</div>}
      {!github.isChecking && !github.connected && (
        <Link href="/dashboard/github" className="health-link">
          Connect GitHub →
        </Link>
      )}
    </div>
  );
}

// ─── Global search ────────────────────────────────────────────────────────────

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K to focus
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="global-search" onClick={() => inputRef.current?.focus()}>
      <Search size={13} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Global search"
      />
      <kbd aria-label="Keyboard shortcut: Ctrl K">⌘K</kbd>
    </div>
  );
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface DashboardShellProps {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  /** focus = full-height layout for diff/workspace pages — no padding, no eyebrow */
  variant?: "default" | "focus";
}

export default function DashboardShell({
  title,
  eyebrow,
  children,
  variant = "default",
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { isDark, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const github = useGitHubConnection();

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/sign-in");
    } else {
      setUser(getStoredUser());
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    setMobileNav(false);
    setMenuOpen(false);
  }, [pathname]);

  // Close popover on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSignOut = useCallback(async () => {
    setMenuOpen(false);
    await logout();
    clearStoredUser();
    dispatch(resetGitHubState());
    dispatch(baseApi.util.resetApiState());
    router.replace("/sign-in");
  }, [dispatch, router]);

  if (!authChecked) {
    return (
      <div className="route-loading" role="status">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin" aria-hidden>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Loading workspace…
      </div>
    );
  }

  const displayName = user ? getDisplayName(user) : "Workspace";
  const initials    = user ? getInitials(user) : "U";
  const accountSub  = github.accountLogin
    ? `@${github.accountLogin}`
    : user?.email ?? "Account";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Build breadcrumb from current nav
  const allNav = [...WORKSPACE_NAV, ...MANAGE_NAV] as readonly { label: string; href: string; exact?: boolean }[];
  const currentNav = allNav.find((n) =>
    n.exact ? pathname === n.href : pathname.startsWith(n.href),
  );

  return (
    <div className={isDark ? "app-shell" : "app-shell light-mode"}>
      {mobileNav && (
        <div className="drawer-backdrop mobile-only" onClick={() => setMobileNav(false)} />
      )}
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">
            <Sparkles size={16} strokeWidth={2.5} />
          </div>
          <span className="brand-name">
            pr<em>·</em>sentinel
          </span>
          <button
            className="btn btn-icon btn-sm"
            style={{ marginLeft: "auto", display: "none" }}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        {/* Workspace badge */}
        <div className="workspace-badge">
          <div className="workspace-avatar" aria-hidden>
            {github.accountLogin?.[0]?.toUpperCase() ?? initials[0]}
          </div>
          <div className="workspace-copy">
            <strong>{github.accountLogin ?? displayName}</strong>
            <span>
              {github.isChecking
                ? "Checking connection…"
                : github.connected
                  ? `${github.repositoriesCount} repos`
                  : "Not connected"}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav-scroll" aria-label="Workspace navigation">
          <div className="nav-section">
            <p className="nav-section-label">Workspace</p>
            {WORKSPACE_NAV.map(({ label, href, icon: Icon, exact }: { label: string; href: string; icon: React.ComponentType<{ size?: number }>; exact?: boolean }) => (
              <Link
                key={href}
                href={href}
                className={`nav-item${isActive(href, exact) ? " active" : ""}`}
                aria-current={isActive(href, exact) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <p className="nav-section-label">Manage</p>
            {MANAGE_NAV.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-item${isActive(href) ? " active" : ""}`}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <GitHubHealth />
          <div className="user-row">
            <div className="user-avatar" aria-hidden>{initials}</div>
            <div className="user-copy">
              <strong>{displayName}</strong>
              <span>{accountSub}</span>
            </div>
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                className="btn btn-icon btn-sm"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Menu size={15} />
              </button>
              {menuOpen && (
                <div className="user-menu" role="menu">
                  <button role="menuitem" onClick={handleSignOut}>
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-icon"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            style={{ display: "none" }} // shown via media query override
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumbs */}
          <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/dashboard" style={{ color: "var(--text-tertiary)" }}>Workspace</Link>
            {currentNav && currentNav.href !== "/dashboard" && (
              <>
                <span className="sep" aria-hidden>/</span>
                <span>{currentNav.label}</span>
              </>
            )}
            {title !== currentNav?.label && currentNav && (
              <>
                <span className="sep" aria-hidden>/</span>
                <strong>{title}</strong>
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="topbar-actions">
            <GlobalSearch />
            <button
              className="btn btn-icon"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={!isDark}
              onClick={toggle}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Content */}
        {variant === "focus" ? (
          <div className="page-scroll--focus">
            <div className="page-content--focus">
              {children}
            </div>
          </div>
        ) : (
          <div className="page-scroll">
            <div className="page-content">
              {eyebrow && (
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  {eyebrow}
                </div>
              )}
              {children}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
