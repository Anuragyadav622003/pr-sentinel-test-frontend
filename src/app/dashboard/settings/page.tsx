"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Bot,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GitBranch,
  Key,
  LogOut,
  Plus,
  RefreshCw,
  Settings2,
  Shield,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import DashboardShell from "@/components/dashboard-shell";
import { useGitHubConnection } from "@/lib/store";
import { useAppDispatch } from "@/lib/store/hooks";
import { baseApi } from "@/lib/store/baseApi";
import { resetGitHubState } from "@/lib/store/githubSlice";
import { clearStoredUser, getStoredUser, logout } from "@/lib/auth";
import { llmApi } from "@/lib/api/llm";
import { FREE_TIER_DAILY_LIMIT } from "@/lib/config";
import type { LlmConfig, LlmMode, LlmModeStatus, LlmProvider } from "@/lib/api/types";

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
    <div className="inline-notice" style={{ marginBottom: 16, alignItems: "flex-start", gap: 10 }}>
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

// ─── Provider labels ──────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<LlmProvider, string> = {
  OPENROUTER: "OpenRouter",
  OPENAI: "OpenAI",
  GEMINI: "Google Gemini",
  ANTHROPIC: "Anthropic",
};

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  OPENROUTER: "google/gemini-flash-1.5",
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini-1.5-flash",
  ANTHROPIC: "claude-3-haiku-20240307",
};

// ─── Add / Edit config form ───────────────────────────────────────────────────

function AddConfigForm({
  onSave,
  onCancel,
  saving,
  error,
}: {
  onSave: (provider: LlmProvider, apiKey: string, model: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [provider, setProvider] = useState<LlmProvider>("OPENROUTER");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(DEFAULT_MODELS["OPENROUTER"]);
  const [showKey, setShowKey] = useState(false);

  function handleProviderChange(p: LlmProvider) {
    setProvider(p);
    setModel(DEFAULT_MODELS[p]);
  }

  return (
    <div
      style={{
        padding: "16px",
        border: "1px solid var(--border)",
        borderRadius: 8,
        background: "var(--surface-raised)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 14,
      }}
    >
      <strong style={{ fontSize: 12 }}>Add BYOK provider</strong>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "9px 11px",
            border: "1px solid #ed879544",
            borderRadius: 6,
            color: "var(--danger)",
            background: "#ed87951a",
            fontSize: 11,
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          {error}
        </div>
      )}

      {/* Provider */}
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Provider
        </span>
        <div className="filter-select" style={{ width: "100%" }}>
          <Bot size={13} style={{ color: "var(--muted)" }} />
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as LlmProvider)}
            style={{ flex: 1 }}
          >
            {(Object.keys(PROVIDER_LABELS) as LlmProvider[]).map((p) => (
              <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
            ))}
          </select>
        </div>
      </label>

      {/* API key */}
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
          API Key
        </span>
        <div
          className="auth-input"
          style={{ display: "flex", alignItems: "center", gap: 8, height: 36, padding: "0 10px" }}
        >
          <Key size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <input
            type={showKey ? "text" : "password"}
            placeholder="sk-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", color: "var(--foreground)", fontSize: 12 }}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? "Hide key" : "Show key"}
            style={{ width: 24, height: 24 }}
          >
            {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </label>

      {/* Model */}
      <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ color: "var(--muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>
          Model
        </span>
        <input
          className="filter-input"
          type="text"
          placeholder={DEFAULT_MODELS[provider]}
          value={model}
          onChange={(e) => setModel(e.target.value)}
          style={{ height: 36, fontSize: 12 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          className="primary-button"
          style={{ fontSize: 11, height: 33 }}
          disabled={saving || !apiKey.trim() || !model.trim()}
          onClick={() => onSave(provider, apiKey.trim(), model.trim())}
        >
          {saving ? <RefreshCw size={13} className="spin" /> : <Check size={13} />}
          {saving ? "Saving…" : "Save config"}
        </button>
        <button
          className="secondary-button"
          style={{ fontSize: 11, height: 33 }}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Config row ───────────────────────────────────────────────────────────────

function ConfigRow({
  config,
  onDelete,
  deleting,
}: {
  config: LlmConfig;
  onDelete: (provider: LlmProvider) => void;
  deleting: boolean;
}) {
  return (
    <div
      className="setting-row"
      style={{ alignItems: "center", gap: 12 }}
    >
      <span>
        <strong>{PROVIDER_LABELS[config.provider]}</strong>
        <small>
          Model: <code style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>{config.model}</code>
          {" · "}API key stored securely
        </small>
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {config.isActive && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "3px 8px",
              borderRadius: 4,
              background: "#70d9a51c",
              color: "var(--success)",
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            <Check size={10} /> Active
          </span>
        )}
        <button
          className="secondary-button"
          style={{ fontSize: 11, height: 30, color: "var(--danger)", borderColor: "#ed879555" }}
          onClick={() => onDelete(config.provider)}
          disabled={deleting}
          aria-label={`Remove ${PROVIDER_LABELS[config.provider]} config`}
        >
          {deleting ? <RefreshCw size={12} className="spin" /> : <Trash2 size={12} />}
          Remove
        </button>
      </div>
    </div>
  );
}

// ─── LLM Model section ────────────────────────────────────────────────────────

function LlmModelSection() {
  const [modeStatus, setModeStatus] = useState<LlmModeStatus | null>(null);
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<LlmProvider | null>(null);
  const [switchingMode, setSwitchingMode] = useState(false);
  const [modeError, setModeError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [mode, cfgs] = await Promise.all([llmApi.getMode(), llmApi.listConfigs()]);
      setModeStatus(mode);
      setConfigs(cfgs);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Failed to load AI settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSaveConfig(provider: LlmProvider, apiKey: string, model: string) {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await llmApi.upsertConfig(provider, apiKey, model);
      setConfigs((prev) => {
        const idx = prev.findIndex((c) => c.provider === saved.provider);
        return idx >= 0
          ? prev.map((c, i) => (i === idx ? saved : c))
          : [...prev, saved];
      });
      setShowAddForm(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save config.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfig(provider: LlmProvider) {
    setDeletingProvider(provider);
    try {
      await llmApi.removeConfig(provider);
      setConfigs((prev) => prev.filter((c) => c.provider !== provider));
      // If we deleted the only BYOK config while in BYOK mode, switch back to FREE
      if (modeStatus?.llmMode === "BYOK" && configs.length === 1) {
        const updated = await llmApi.getMode();
        setModeStatus(updated);
      }
    } catch {
      // non-critical — user can retry
    } finally {
      setDeletingProvider(null);
    }
  }

  async function handleToggleMode(newMode: LlmMode) {
    setSwitchingMode(true);
    setModeError(null);
    try {
      await llmApi.updateMode(newMode);
      const updated = await llmApi.getMode();
      setModeStatus(updated);
    } catch (e: unknown) {
      setModeError(e instanceof Error ? e.message : "Failed to switch mode.");
    } finally {
      setSwitchingMode(false);
    }
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[80, 60, 40].map((w, i) => (
          <span key={i} className="skeleton" style={{ display: "block", height: 14, width: `${w}%`, borderRadius: 4 }} />
        ))}
      </div>
    );
  }

  // ── Load error ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--danger)", fontSize: 12 }}>
        <AlertTriangle size={14} />
        {loadError}
        <button className="link-button" onClick={fetchData} style={{ marginLeft: 4 }}>
          Retry
        </button>
      </div>
    );
  }

  const isByok = modeStatus?.llmMode === "BYOK";
  const freeRemaining = modeStatus?.remainingFree;
  const dailyLimit = FREE_TIER_DAILY_LIMIT;
  const used = freeRemaining !== undefined ? Math.max(0, dailyLimit - freeRemaining) : 0;

  return (
    <div>
      {/* Mode toggle row */}
      <SettingRow
        label="Review mode"
        description={
          isByok
            ? "Using your own API key (BYOK). No daily limit."
            : freeRemaining !== undefined
              ? `Free tier — ${freeRemaining} review${freeRemaining !== 1 ? "s" : ""} remaining today (limit: ${dailyLimit}/day).`
              : `Free tier active (${dailyLimit} reviews/day).`
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: isByok ? "var(--accent)" : "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            {isByok ? <Key size={11} /> : <Zap size={11} />}
            {isByok ? "BYOK" : "Free"}
          </span>
          <button
            className="secondary-button"
            style={{ fontSize: 11, height: 30 }}
            disabled={switchingMode || (!isByok && configs.length === 0)}
            title={!isByok && configs.length === 0 ? "Add a BYOK config first" : undefined}
            onClick={() => handleToggleMode(isByok ? "FREE" : "BYOK")}
          >
            {switchingMode
              ? <RefreshCw size={12} className="spin" />
              : isByok ? <Zap size={12} /> : <Key size={12} />}
            Switch to {isByok ? "Free" : "BYOK"}
          </button>
        </div>
      </SettingRow>

      {/* Free quota bar */}
      {!isByok && freeRemaining !== undefined && (
        <div style={{ padding: "10px 0 4px" }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            color: "var(--muted)",
            marginBottom: 5,
          }}>
            <span>Daily free reviews used</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {used} / {dailyLimit}
            </span>
          </div>
          <div style={{
            height: 5,
            borderRadius: 99,
            background: "var(--surface-raised)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${dailyLimit > 0 ? Math.min(100, Math.round((used / dailyLimit) * 100)) : 0}%`,
              borderRadius: 99,
              background: freeRemaining === 0 ? "var(--danger)" : "var(--accent)",
              transition: "width .3s ease",
            }} />
          </div>
          {freeRemaining === 0 && (
            <p style={{ margin: "6px 0 0", color: "var(--danger)", fontSize: 11 }}>
              Daily limit reached. Add a BYOK key to continue reviewing.
            </p>
          )}
        </div>
      )}

      {modeError && (
        <div style={{
          display: "flex", gap: 8, marginTop: 10, padding: "8px 10px",
          border: "1px solid #ed879544", borderRadius: 6,
          color: "var(--danger)", background: "#ed87951a", fontSize: 11,
        }}>
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          {modeError}
        </div>
      )}

      {/* BYOK configs */}
      <div style={{ marginTop: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <strong style={{ fontSize: 12 }}>Bring your own key (BYOK)</strong>
            <p style={{ margin: "3px 0 0", color: "var(--muted)", fontSize: 11 }}>
              Add API keys to use your own AI provider accounts. Keys are encrypted at rest.
            </p>
          </div>
          <button
            className="secondary-button"
            style={{ fontSize: 11, height: 30, flexShrink: 0 }}
            onClick={() => { setShowAddForm(true); setSaveError(null); }}
          >
            <Plus size={12} />
            Add key
          </button>
        </div>

        {configs.length === 0 && !showAddForm && (
          <div style={{
            padding: "18px 14px",
            border: "1px dashed var(--border)",
            borderRadius: 8,
            color: "var(--muted)",
            fontSize: 12,
            textAlign: "center",
          }}>
            No BYOK keys configured. Add one above to unlock unlimited reviews.
          </div>
        )}

        {configs.map((cfg) => (
          <ConfigRow
            key={cfg.provider}
            config={cfg}
            onDelete={handleDeleteConfig}
            deleting={deletingProvider === cfg.provider}
          />
        ))}

        {showAddForm && (
          <AddConfigForm
            onSave={handleSaveConfig}
            onCancel={() => { setShowAddForm(false); setSaveError(null); }}
            saving={saving}
            error={saveError}
          />
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const github = useGitHubConnection();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = getStoredUser();

  // Review policy
  const [autoReview, setAutoReview] = useState(true);
  const [blockMerge, setBlockMerge] = useState(false);
  const [postComments, setPostComments] = useState(true);
  const [reviewDrafts, setReviewDrafts] = useState(false);

  // Notifications
  const [notifyFailed, setNotifyFailed] = useState(true);
  const [notifyCompleted, setNotifyCompleted] = useState(false);
  const [notifyCritical, setNotifyCritical] = useState(true);

  const connected = github.connected;
  const accountLogin = github.accountLogin;

  async function handleSignOut() {
    await logout();
    clearStoredUser();
    dispatch(resetGitHubState());
    dispatch(baseApi.util.resetApiState());
    router.replace("/sign-in");
  }

  return (
    <DashboardShell title="Settings" eyebrow="SETTINGS">
      <div className="data-header" style={{ marginBottom: 28 }}>
        <div>
          <h1>Workspace settings</h1>
          <p>Control review policy, AI model, notifications, and account preferences.</p>
        </div>
      </div>

      {!github.isChecking && !connected && <ConnectionNotice />}

      {/* ── Review policy ───────────────────────────────────────── */}
      <SectionCard icon={<Shield size={17} />} title="Review policy" subtitle="How PR Sentinel analyzes and responds to pull requests">
        <SettingRow label="Automatic review" description="Trigger an AI review whenever a pull request is opened or updated." disabled={!connected}>
          <Toggle checked={autoReview} onChange={setAutoReview} disabled={!connected} />
        </SettingRow>
        <SettingRow label="Post review comments" description="Write inline findings as GitHub PR comments after each review." disabled={!connected}>
          <Toggle checked={postComments} onChange={setPostComments} disabled={!connected} />
        </SettingRow>
        <SettingRow label="Review draft PRs" description="Include draft pull requests in the automatic review queue." disabled={!connected}>
          <Toggle checked={reviewDrafts} onChange={setReviewDrafts} disabled={!connected} />
        </SettingRow>
        <SettingRow label="Block merge on critical findings" description="Set a failing commit status when a review contains CRITICAL severity issues." disabled={!connected}>
          <Toggle checked={blockMerge} onChange={setBlockMerge} disabled={!connected} />
        </SettingRow>
      </SectionCard>

      {/* ── AI model ─────────────────────────────────────────────── */}
      <SectionCard icon={<Bot size={17} />} title="AI model" subtitle="Configure your review provider and API keys">
        <LlmModelSection />
      </SectionCard>

      {/* ── Notifications ────────────────────────────────────────── */}
      <SectionCard icon={<Bell size={17} />} title="Notifications" subtitle="Email and in-app alerts for review lifecycle events">
        <SettingRow label="Critical findings alert" description="Receive an alert when a review uncovers CRITICAL severity issues." disabled={!connected}>
          <Toggle checked={notifyCritical} onChange={setNotifyCritical} disabled={!connected} />
        </SettingRow>
        <SettingRow label="Review failed" description="Get notified when a review job fails and requires a manual retry." disabled={!connected}>
          <Toggle checked={notifyFailed} onChange={setNotifyFailed} disabled={!connected} />
        </SettingRow>
        <SettingRow label="Review completed" description="Receive a summary notification each time a review finishes successfully." disabled={!connected}>
          <Toggle checked={notifyCompleted} onChange={setNotifyCompleted} disabled={!connected} />
        </SettingRow>
      </SectionCard>

      {/* ── GitHub connection ─────────────────────────────────────── */}
      <SectionCard icon={<GitBranch size={17} />} title="GitHub connection" subtitle="Manage your GitHub App installation">
        {github.isChecking ? (
          <div className="skeleton" style={{ height: 40, borderRadius: 6 }} />
        ) : connected ? (
          <div className="setting-row">
            <span>
              <strong>Connected account</strong>
              <small>
                GitHub App installed on{" "}
                <code style={{ padding: "1px 5px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface-raised)", fontFamily: "var(--font-mono)", fontSize: 10 }}>
                  {accountLogin ?? "your account"}
                </code>
                {" "}— {github.repositoriesCount} repositor{github.repositoriesCount === 1 ? "y" : "ies"} monitored.
              </small>
            </span>
            <button className="secondary-button" style={{ fontSize: 11, height: 33 }} onClick={() => router.push("/dashboard/github")}>
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
            <button className="primary-button" style={{ fontSize: 11, height: 33 }} onClick={() => router.push("/dashboard/github")}>
              Connect GitHub <ChevronRight size={13} />
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Account ──────────────────────────────────────────────── */}
      <SectionCard icon={<Users size={17} />} title="Account" subtitle="Your PR Sentinel workspace account">
        <div className="setting-row">
          <span>
            <strong>Signed in as</strong>
            <small>{user?.githubLogin ? `@${user.githubLogin}` : user?.email ?? "Workspace member"}</small>
          </span>
        </div>
        <div className="setting-row" style={{ borderTop: "1px solid #ed879533" }}>
          <span>
            <strong style={{ color: "var(--danger)" }}>Sign out</strong>
            <small>End your current session and return to the sign-in screen.</small>
          </span>
          <button className="secondary-button" style={{ fontSize: 11, height: 33, color: "var(--danger)", borderColor: "#ed879555" }} onClick={handleSignOut}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </SectionCard>

      {/* ── Danger zone ──────────────────────────────────────────── */}
      <div className="workspace-panel" style={{ borderColor: "#ed879533", background: "#ed87950a" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>
          <Trash2 size={15} />
          Danger zone
        </div>
        <div className="setting-row" style={{ borderTop: "1px solid #ed879533" }}>
          <span>
            <strong>Disconnect GitHub</strong>
            <small>Remove the GitHub App installation. Existing review data is retained.</small>
          </span>
          <button
            disabled={!connected}
            className="secondary-button"
            style={{ fontSize: 11, height: 33, color: "var(--danger)", borderColor: "#ed879555", opacity: connected ? 1 : 0.4 }}
          >
            Disconnect
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
