"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  AlertTriangle,
  ArrowUp,
  Bot,
  Check,
  Copy,
  GitPullRequest,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { reviewsApi } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import type { ChatBubble, Review, ReviewComment, Severity } from "@/lib/api/types";

// ─── Context-aware suggestions ────────────────────────────────────────────────

function buildSuggestions(review: Review): string[] {
  const comments = review.comments ?? [];
  const criticals = comments.filter((c) => c.severity === "CRITICAL");
  const hasSecurity = comments.some((c) =>
    c.category?.toLowerCase().includes("security") ||
    c.category?.toLowerCase().includes("injection") ||
    c.message?.toLowerCase().includes("security"),
  );

  const base = ["Summarize this PR", "What should I fix first?", "Explain the review findings"];
  if (criticals.length > 0) base.unshift(`Explain the ${criticals.length} critical issue${criticals.length > 1 ? "s" : ""}`);
  if (hasSecurity) base.push("Walk me through the security risks");
  base.push("How do I fix these issues?");
  return [...new Set(base)].slice(0, 5);
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* non-HTTPS */ }
  }
  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span className="chat-code-lang">{lang || "code"}</span>
        <button className="chat-copy-btn" onClick={copy} aria-label={copied ? "Copied" : "Copy"}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="chat-code-pre"><code>{code}</code></pre>
    </div>
  );
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/(```[\s\S]*?```)/g);
  parts.forEach((part, idx) => {
    if (part.startsWith("```")) {
      const nl = part.indexOf("\n");
      const lang = nl > 3 ? part.slice(3, nl).trim() : "";
      const code = part.slice(nl > 3 ? nl + 1 : 3).replace(/```$/, "").trimEnd();
      nodes.push(<CodeBlock key={idx} code={code} lang={lang} />);
    } else {
      const lines = part.split("\n");
      lines.forEach((line, li) => {
        if (li > 0) nodes.push(<br key={`${idx}-br-${li}`} />);
        const segs = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
        segs.forEach((seg, si) => {
          const k = `${idx}-${li}-${si}`;
          if (seg.startsWith("**") && seg.endsWith("**")) {
            nodes.push(<strong key={k}>{seg.slice(2, -2)}</strong>);
          } else if (seg.startsWith("`") && seg.endsWith("`")) {
            nodes.push(<code key={k} className="chat-inline-code">{seg.slice(1, -1)}</code>);
          } else if (seg) {
            nodes.push(<span key={k}>{seg}</span>);
          }
        });
      });
    }
  });
  return nodes;
}

// ─── Bubble components ────────────────────────────────────────────────────────

function MessageBubble({ bubble }: { bubble: ChatBubble }) {
  const isUser = bubble.role === "user";
  return (
    <div className={`chat-bubble-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="chat-avatar assistant" aria-hidden>
          <Bot size={13} />
        </div>
      )}
      <div className={`chat-bubble ${isUser ? "user" : "assistant"}`}>
        {isUser
          ? <p style={{ margin: 0 }}>{bubble.content}</p>
          : <div>{renderMarkdown(bubble.content)}</div>}
      </div>
      {isUser && (
        <div className="chat-avatar user" aria-hidden>
          <User size={13} />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-bubble-row assistant">
      <div className="chat-avatar assistant" aria-hidden><Bot size={13} /></div>
      <div className="chat-bubble assistant chat-typing" aria-label="AI is thinking">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ─── Finding reference chip (shown in header when a finding is pinned) ────────

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: "var(--sev-critical)", HIGH: "var(--sev-high)",
  MEDIUM: "var(--sev-medium)", LOW: "var(--sev-low)",
};

function PinnedFinding({
  finding,
  onDismiss,
}: { finding: ReviewComment; onDismiss: () => void }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "var(--sp-2)",
        padding: "var(--sp-2) var(--sp-3)",
        border: `1px solid ${finding.severity ? SEV_COLOR[finding.severity] : "var(--border)"}44`,
        borderRadius: "var(--r-md)",
        background: finding.severity ? `${SEV_COLOR[finding.severity]}14` : "var(--surface-raised)",
        fontSize: "var(--text-xs)",
        flex: 1, minWidth: 0,
      }}
    >
      {finding.severity && (
        <span style={{ color: SEV_COLOR[finding.severity], fontWeight: 700, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {finding.severity}
        </span>
      )}
      <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {finding.filePath}
        {finding.lineNumber != null ? `:${finding.lineNumber}` : ""}
      </span>
      <button
        className="btn btn-icon btn-sm"
        onClick={onDismiss}
        aria-label="Dismiss finding context"
        style={{ flexShrink: 0, marginLeft: "auto" }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ─── Empty / suggestion state ─────────────────────────────────────────────────

function SuggestionsView({
  review,
  onSelect,
}: { review: Review; onSelect: (q: string) => void }) {
  const suggestions = buildSuggestions(review);
  const commentCount = review.comments?.length ?? 0;
  return (
    <div className="chat-suggestions-wrap">
      <div className="chat-empty-icon"><Sparkles size={20} /></div>
      <p className="chat-empty-title">Ask anything about this PR</p>
      <p className="chat-empty-sub">
        {commentCount > 0
          ? `I can explain ${commentCount} finding${commentCount !== 1 ? "s" : ""}, suggest fixes, and answer questions about the changed code.`
          : "I have access to the review summary, changed files, and PR metadata."}
      </p>
      <div className="chat-suggestions">
        {suggestions.map((q) => (
          <button key={q} className="chat-suggestion" onClick={() => onSelect(q)}>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface AiReviewChatProps {
  review: Review;
  /** Pre-pin a finding (e.g. from clicking "Ask AI" on a finding card) */
  initialFinding?: ReviewComment;
}

export function AiReviewChat({ review, initialFinding }: AiReviewChatProps) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinnedFinding, setPinnedFinding] = useState<ReviewComment | null>(initialFinding ?? null);

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, loading]);

  // Auto-resize textarea
  function growTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      // Build message with finding context prefix if pinned
      const fullText = pinnedFinding
        ? `Regarding ${pinnedFinding.severity ?? ""} finding in ${pinnedFinding.filePath}${pinnedFinding.lineNumber != null ? `:${pinnedFinding.lineNumber}` : ""}: ${trimmed}`
        : trimmed;

      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setError(null);
      setBubbles((prev) => [...prev, { role: "user", content: trimmed }]);
      setLoading(true);
      abortRef.current = new AbortController();

      try {
        const res = await reviewsApi.chat(
          review.id,
          { message: fullText, conversationId },
          abortRef.current.signal,
        );
        setConversationId(res.conversationId);
        setBubbles((prev) => [...prev, { role: "assistant", content: res.message }]);
        setPinnedFinding(null); // unpin after send
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
        setBubbles((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, review.id, conversationId, pinnedFinding],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const prRef = review as Review & { pullRequest?: { githubPrNumber?: number; title?: string } };
  const prNumber = prRef.pullRequest?.githubPrNumber;
  const prTitle  = prRef.pullRequest?.title;

  return (
    <section className="ai-chat-root" aria-label="AI Review Assistant">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-icon">
          <Sparkles size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="ai-chat-header-title">AI Review Assistant</h3>
          {prNumber && (
            <p className="ai-chat-header-sub">
              <GitPullRequest size={11} style={{ display: "inline", marginRight: 3 }} aria-hidden />
              PR #{prNumber}{prTitle ? ` · ${prTitle}` : ""}
            </p>
          )}
        </div>
        {bubbles.length > 0 && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => { setBubbles([]); setConversationId(undefined); setError(null); }}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="ai-chat-messages" role="log" aria-live="polite" aria-label="Conversation">
        {bubbles.length === 0 ? (
          <SuggestionsView review={review} onSelect={(q) => void sendMessage(q)} />
        ) : (
          <>
            {bubbles.map((b, i) => <MessageBubble key={i} bubble={b} />)}
            {loading && <TypingIndicator />}
            {error && (
              <div className="chat-error" role="alert">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="ai-chat-form" onSubmit={handleSubmit}>
        {/* Pinned finding context */}
        {pinnedFinding && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", flexShrink: 0 }}>Asking about:</span>
            <PinnedFinding finding={pinnedFinding} onDismiss={() => setPinnedFinding(null)} />
          </div>
        )}
        <div className="ai-chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="ai-chat-input"
            value={input}
            rows={1}
            placeholder={pinnedFinding ? `Ask about this ${pinnedFinding.severity ?? "finding"}…` : "Ask about this PR…"}
            disabled={loading}
            onChange={(e) => { setInput(e.target.value); growTextarea(); }}
            onKeyDown={handleKeyDown}
            aria-label="Chat message"
          />
          <button
            type="submit"
            className="ai-chat-send"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <ArrowUp size={14} />
          </button>
        </div>
        <p className="ai-chat-hint">Enter to send · Shift+Enter for newline</p>
      </form>
    </section>
  );
}
