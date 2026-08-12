"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Bot,
  ChevronRight,
  GitBranch,
  LogOut,
  Settings2,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { useGitHubInstallation } from "@/lib/api/hooks";
import { clearStoredUser, getStoredUser, logout } from "@/lib/auth";

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: 38,
        height: 22,
        padding: 3,
        border: "1px solid var(--border)",
        borderRadius: 99,
        background: checked ? "var(--accent)" : "var(--surface-raised)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "background .15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: checked ? "#0b1018" : "var(--muted)",
          transform: checked ? "translateX(16px)" : "translateX(0)",
          transition: "transform .15s ease, background .15s ease",
        }}
      />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="workspace-panel" style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 8,
            color: "var(--accent)",
            background: "#61d8c71f",
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div>
          <strong style={{ fontSize: 13, display: "block" }}>{title}</strong>
          <span style={{ color: "var(--muted)", fontSize: 11 }}>{subtitle}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Setting row ─────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
  disabled,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="setting-row" style={{ opacity: disabled ? 0.55 : 1 }}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      {children}
    </div>
  );
}

// ─── Connection required notice ───────────────────────────────────────────────

function ConnectionNotice() {
  const router = useRouter();
  return (
    <div
      className="inline-notice"
      style={{ marginBottom: 16, alignItems: "flex-start", gap: 10 }}
    >
      <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      <span>
        Connect a GitHub repository before configuring review policy and notifications.{" "}
        <button
          className="link-button"
          style={{ display: "inline-flex", verticalAlign: "baseline" }}
          onClick={() => router.push("/dashboard/github")}
        >
          Connect GitHub <ChevronRight size={12} />
        </button>
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { status, isLoading } = useGitHubInstallation();
  const router = useRouter();
  const user = getStoredUser();

  // Review policy settings
  const [autoReview, setAutoReview] = useState(true);
  const [blockMerge, setBlockMerge] = useState(false);
  const [postComments, setPostComments] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState(false);

  // Notification settings
  const [notifyFailed, setNotifyFailed] = useState(true);
  const [notifyCompleted, setNotifyCompleted] = useState(false);
  const [notifyCritical, setNotifyCritical] = useState(true);

  const connected = !!status?.connected;
  const accountLogin = status?.installation?.accountLogin;

  async function handleSignOut() {
    await logout();
    clearStoredUser();
    router.replace("/sign-in");
  }

  return (
    <DashboardShell title="Settings" eyebrow="SETTINGS">
      {/* Page header */}
      <div className="data-header" style={{ marginBottom: 28 }}>
        <div>
          <h1>Workspace settings</h1>
          <p>Control review policy, notifications, and account preferences.</p>
        </div>
      </div>

      {!isLoading && !connected && <ConnectionNotice />}

      {/* ── Review policy ───────────────────────────────────────── */}
      <SectionCard
        icon={<Shield size={17} />}
        title="Review policy"
        subtitle="How PR Sentinel analyzes and responds to pull requests"
      >
        <SettingRow
          label="Automatic review"
          description="Trigger an AI review whenever a pull request is opened or updated."
          disabled={!connected}
        >
          <Toggle
            checked={autoReview}
            onChange={setAutoReview}
            disabled={!connected}
          />
        </SettingRow>
        <SettingRow
          label="Post review comments"
          description="Write inline findings as GitHub PR comments after each review."
          disabled={!connected}
        >
          <Toggle
            checked={postComments}
            onChange={setPostComments}
            disabled={!connected}
          />
        </SettingRow>
        <SettingRow
          label="Review draft PRs"
          description="Include draft pull requests in the automatic review queue."
          disabled={!connected}
        >
          <Toggle
            checked={reviewDrafts}
            onChange={setReviewDrafts}
            disabled={!connected}
          />
        </SettingRow>
        <SettingRow
          label="Block merge on critical findings"
          description="Set a failing commit status when a review contains CRITICAL severity issues."
          disabled={!connected}
        >
          <Toggle
            checked={blockMerge}
            onChange={setBlockMerge}
            disabled={!connected}
          />
        </SettingRow>
      </SectionCard>

      {/* ── Notifications ────────────────────────────────────────── */}
      <SectionCard
        icon={<Bell size={17} />}
        title="Notifications"
        subtitle="Email and in-app alerts for review lifecycle events"
      >
        <SettingRow
          label="Critical findings alert"
          description="Receive an alert when a review uncovers CRITICAL severity issues."
          disabled={!connected}
        >
          <Toggle
            checked={notifyCritical}
            onChange={setNotifyCritical}
            disabled={!connected}
          />
        </SettingRow>
        <SettingRow
          label="Review failed"
          description="Get notified when a review job fails and requires a manual retry."
          disabled={!connected}
        >
          <Toggle
            checked={notifyFailed}
            onChange={setNotifyFailed}
            disabled={!connected}
          />
        </SettingRow>
        <SettingRow
          label="Review completed"
          description="Receive a summary notification each time a review finishes successfully."
          disabled={!connected}
        >
          <Toggle
            checked={notifyCompleted}
            onChange={setNotifyCompleted}
            disabled={!connected}
          />
        </SettingRow>
      </SectionCard>

      {/* ── AI model ─────────────────────────────────────────────── */}
      <SectionCard
        icon={<Bot size={17} />}
        title="AI model"
        subtitle="Review engine powering the analysis"
      >
        <SettingRow
          label="Review provider"
          description="The AI model that performs code analysis."
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--surface-raised)",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            <Bot size={13} />
            GPT-4o (default)
          </div>
        </SettingRow>
      </SectionCard>

      {/* ── GitHub connection ─────────────────────────────────────── */}
      <SectionCard
        icon={<GitBranch size={17} />}
        title="GitHub connection"
        subtitle="Manage your GitHub App installation"
      >
        {isLoading ? (
          <div
            className="skeleton"
            style={{ height: 40, borderRadius: 6 }}
          />
        ) : connected ? (
          <div className="setting-row">
            <span>
              <strong>Connected account</strong>
              <small>
                GitHub App installed on{" "}
                <code
                  style={{
                    padding: "1px 5px",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    background: "var(--surface-raised)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                  }}
                >
                  {accountLogin ?? "your account"}
                </code>{" "}
                — {status?.repositoryCount ?? 0} repositor
                {status?.repositoryCount === 1 ? "y" : "ies"} monitored.
              </small>
            </span>
            <button
              className="secondary-button"
              style={{ fontSize: 11, height: 33 }}
              onClick={() => router.push("/dashboard/github")}
            >
              <GitBranch size={14} />
              Manage
            </button>
          </div>
        ) : (
          <div className="setting-row">
            <span>
              <strong>Not connected</strong>
              <small>Link your GitHub account to start monitoring pull requests.</small>
            </span>
            <button
              className="primary-button"
              style={{ fontSize: 11, height: 33 }}
              onClick={() => router.push("/dashboard/github")}
            >
              Connect GitHub <ChevronRight size={13} />
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Account ──────────────────────────────────────────────── */}
      <SectionCard
        icon={<Users size={17} />}
        title="Account"
        subtitle="Your PR Sentinel workspace account"
      >
        <div className="setting-row">
          <span>
            <strong>Signed in as</strong>
            <small>
              {user?.githubLogin
                ? `@${user.githubLogin}`
                : user?.email ?? "Workspace member"}
            </small>
          </span>
        </div>
        <div className="setting-row" style={{ borderTop: "1px solid #ed879533" }}>
          <span>
            <strong style={{ color: "var(--danger)" }}>Sign out</strong>
            <small>End your current session and return to the sign-in screen.</small>
          </span>
          <button
            className="secondary-button"
            style={{ fontSize: 11, height: 33, color: "var(--danger)", borderColor: "#ed879555" }}
            onClick={handleSignOut}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </SectionCard>

      {/* ── Danger zone ──────────────────────────────────────────── */}
      <div
        className="workspace-panel"
        style={{ borderColor: "#ed879533", background: "#ed87950a" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            color: "var(--danger)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <Trash2 size={15} />
          Danger zone
        </div>
        <div className="setting-row" style={{ borderTop: "1px solid #ed879533" }}>
          <span>
            <strong>Disconnect GitHub</strong>
            <small>
              Remove the GitHub App installation. Existing review data is retained.
            </small>
          </span>
          <button
            disabled={!connected}
            className="secondary-button"
            style={{
              fontSize: 11,
              height: 33,
              color: "var(--danger)",
              borderColor: "#ed879555",
              opacity: connected ? 1 : 0.4,
            }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
