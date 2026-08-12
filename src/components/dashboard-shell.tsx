"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Settings2,
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
import { useGitHubInstallation } from "@/lib/api/hooks";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: "Repositories", href: "/dashboard/repositories", icon: Code2 },
  { label: "Pull requests", href: "/dashboard/pull-requests", icon: GitPullRequest },
  { label: "Reviews", href: "/dashboard/reviews", icon: ShieldCheck },
] as const;

const MANAGE = [
  { label: "GitHub", href: "/dashboard/github", icon: GitBranch },
  { label: "Settings", href: "/dashboard/settings", icon: Settings2 },
] as const;

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const saved = window.localStorage.getItem("pr_sentinel_theme");
    if (saved) setIsDark(saved === "dark");
  }, []);
  useEffect(() => {
    window.localStorage.setItem("pr_sentinel_theme", isDark ? "dark" : "light");
  }, [isDark]);
  return { isDark, toggle: () => setIsDark((v) => !v) };
}

function GitHubHealth() {
  const { status, isLoading } = useGitHubInstallation();
  if (isLoading) {
    return (
      <div className="health-card">
        <div className="health-title">
          <span className="pulse-dot pending" />
          Checking GitHub…
        </div>
        <span>Verifying your installation</span>
      </div>
    );
  }
  if (status?.connected) {
    return (
      <div className="health-card">
        <div className="health-title">
          <span className="pulse-dot" />
          GitHub connected
        </div>
        <span>
          {status.repositoryCount} repositor
          {status.repositoryCount === 1 ? "y" : "ies"} monitored
        </span>
      </div>
    );
  }
  return (
    <div className="health-card">
      <div className="health-title">
        <span className="pulse-dot danger" />
        GitHub not connected
      </div>
      <Link href="/dashboard/github" className="health-link">
        Connect GitHub to begin
      </Link>
    </div>
  );
}

export default function DashboardShell({
  title,
  eyebrow,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggle } = useTheme();
  const [mobileNav, setMobileNav] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const { status } = useGitHubInstallation();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/sign-in");
    } else {
      setUser(getStoredUser());
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileNav(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSignOut() {
    await logout();
    clearStoredUser();
    router.replace("/sign-in");
  }

  if (!authChecked) {
    return <div className="route-loading">Loading workspace…</div>;
  }

  const displayName = user ? getDisplayName(user) : "Workspace member";
  const initials = user ? getInitials(user) : "U";
  const accountLabel = status?.installation?.accountLogin
    ? `@${status.installation.accountLogin}`
    : user?.githubLogin
    ? `@${user.githubLogin}`
    : user?.email ?? "Account";

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

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
          <div className="workspace-avatar">
            {status?.installation?.accountLogin?.[0]?.toUpperCase() ?? initials[0]}
          </div>
          <div className="workspace-copy">
            <strong>{status?.installation?.accountLogin ?? "Workspace"}</strong>
            <span>{status?.connected ? "GitHub connected" : "Connect GitHub to begin"}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <p className="nav-label">Workspace</p>
          {NAV.map(({ label, href, icon: Icon, exact }: { label: string; href: string; icon: React.ComponentType<{ size?: number }>; exact?: boolean }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href, exact) ? "active" : ""}`}
              aria-current={isActive(href, exact) ? "page" : undefined}
              onClick={() => setMobileNav(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
          <p className="nav-label nav-label-spaced">Manage</p>
          {MANAGE.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? "active" : ""}`}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={() => setMobileNav(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <GitHubHealth />
          <div className="user-row">
            <div className="user-avatar">{initials}</div>
            <div className="user-copy">
              <strong>{displayName}</strong>
              <span>{accountLabel}</span>
            </div>
            <div className="user-menu-wrap">
              <button
                className="icon-button"
                aria-label="Account menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <Menu size={17} />
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
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="icon-button"
              type="button"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
              onClick={toggle}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        <div className="content-wrap workspace-content">
          {eyebrow && (
            <div className="eyebrow shell-eyebrow">
              <span className="eyebrow-line" />
              {eyebrow}
            </div>
          )}
          {actions && <div className="shell-actions">{actions}</div>}
          {children}
        </div>
      </main>
    </div>
  );
}
