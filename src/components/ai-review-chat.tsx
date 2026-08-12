"use client";

/**
 * AiReviewChat
 * Context-aware chat assistant scoped to a single AI review.
 * Communicates with POST /api/reviews/:id/chat on the NestJS backend.
 * No LLM credentials are ever exposed to the browser.
 */

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
  Copy,
  Check,
  Sparkles,
  User,
} from "lucide-react";
import { reviewsApi } from "@/lib/api/reviews";
import { ApiError } from "@/lib/api/client";
import type { ChatBubble, Review } from "@/lib/api/types";

// ─── Suggested questions shown when the chat is empty ────────────────────────

const SUGGESTIONS = [
  "Summarize this PR",
  "Explain the critical findings",
  "Show me the security risks",
  "How should I fix these issues?",
  "Which issue should I fix first?",
];

// ─── Minimal markdown renderer ────────────────────────────────────────────────
// The project does not (yet) depend on react-markdown or remark, so we handle
// the most common LLM output patterns ourselves: fenced code blocks, inline
// code, bold, and line-breaks.  This avoids adding a heavyweight dependency
// while still producing readable output.

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Split on fenced code blocks (``` … ```)
  const parts = text.split(/(```[\s\S]*?```)/g);

  parts.forEach((part, idx) => {
    if (part.startsWith("```")) {
      // Code block
      const firstNewline = part.indexOf("\n");
      const lang = firstNewline > 3 ? part.slice(3, firstNewline).trim() : "";
      const code = part
        .slice(firstNewline > 3 ? firstNewline + 1 : 3)
        .replace(/```$/, "")
        .trimEnd();
      nodes.push(<CodeBlock key={idx} code={code} lang={lang} />);
    } else {
      // Inline rendering: bold (**text**), inline code (`code`), newlines
      const lines = part.split("\n");
      lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) nodes.push(<br key={`${idx}-br-${lineIdx}`} />);
        // Process bold + inline code within the line
        const segments = line.split(/(\*\*.*?\*\*|`[^`]+`)/g);
        segments.forEach((seg, segIdx) => {
          if (seg.startsWith("**") && seg.endsWith("**")) {
            nodes.push(<strong key={`${idx}-${lineIdx}-${segIdx}`}>{seg.slice(2, -2)}</strong>);
          } else if (seg.startsWith("`") && seg.endsWith("`")) {
            nodes.push(
              <code key={`${idx}-${lineIdx}-${segIdx}`} className="chat-inline-code">
                {seg.slice(1, -1)}
              </code>
            );
          } else if (seg) {
            nodes.push(<span key={`${idx}-${lineIdx}-${segIdx}`}>{seg}</span>);
          }
        });
      });
    }
  });

  return nodes;
}

// ─── Code block with copy button ─────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (non-HTTPS dev env, etc.)
    }
  }

  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span className="chat-code-lang">{lang || "code"}</span>
        <button
          className="chat-copy-btn"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="chat-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────

function MessageBubble({ bubble }: { bubble: ChatBubble }) {
  const isUser = bubble.role === "user";
  return (
    <div className={`chat-bubble-row ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="chat-avatar assistant" aria-hidden>
          <Bot size={14} />
        </div>
      )}
      <div className={`chat-bubble ${isUser ? "user" : "assistant"}`}>
        {isUser ? (
          <p className="chat-bubble-text">{bubble.content}</p>
        ) : (
          <div className="chat-bubble-text">{renderMarkdown(bubble.content)}</div>
        )}
      </div>
      {isUser && (
        <div className="chat-avatar user" aria-hidden>
          <User size={14} />
        </div>
      )}
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="chat-bubble-row assistant">
      <div className="chat-avatar assistant" aria-hidden>
        <Bot size={14} />
      </div>
      <div className="chat-bubble assistant chat-typing" aria-label="AI is thinking">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

// ─── Suggested questions empty state ─────────────────────────────────────────

function SuggestedQuestions({
  onSelect,
}: {
  onSelect: (q: string) => void;
}) {
  return (
    <div className="chat-suggestions-wrap">
      <div className="chat-empty-icon">
        <Sparkles size={20} />
      </div>
      <p className="chat-empty-title">Ask anything about this PR</p>
      <p className="chat-empty-sub">
        I have access to the review findings, changed files, and PR metadata.
      </p>
      <div className="chat-suggestions">
        {SUGGESTIONS.map((q) => (
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
}

export function AiReviewChat({ review }: AiReviewChatProps) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to the bottom whenever new bubbles arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bubbles, loading]);

  // Auto-resize textarea as the user types
  function growTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setError(null);

      // Optimistically append the user bubble
      setBubbles((prev) => [...prev, { role: "user", content: trimmed }]);
      setLoading(true);

      abortRef.current = new AbortController();

      try {
        const res = await reviewsApi.chat(
          review.id,
          { message: trimmed, conversationId },
          abortRef.current.signal,
        );
        setConversationId(res.conversationId);
        setBubbles((prev) => [...prev, { role: "assistant", content: res.message }]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg =
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again.";
        setError(msg);
        // Remove the optimistically-added user bubble on failure
        setBubbles((prev) => prev.slice(0, -1));
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [loading, review.id, conversationId],
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter → send; Shift+Enter → newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  const canSend = input.trim().length > 0 && !loading;
  const isEmpty = bubbles.length === 0;

  const prNumber = (review as Review & { pullRequest?: { githubPrNumber?: number; title?: string } })
    .pullRequest?.githubPrNumber;
  const prTitle = (review as Review & { pullRequest?: { title?: string } }).pullRequest?.title;

  return (
    <section className="ai-chat-root" aria-label="AI Review Assistant">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-icon">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="ai-chat-header-title">AI Review Assistant</h3>
          {prNumber && (
            <p className="ai-chat-header-sub">
              PR #{prNumber}
              {prTitle ? ` · ${prTitle}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="ai-chat-messages" role="log" aria-live="polite">
        {isEmpty ? (
          <SuggestedQuestions onSelect={(q) => void sendMessage(q)} />
        ) : (
          <>
            {bubbles.map((b, i) => (
              <MessageBubble key={i} bubble={b} />
            ))}
            {loading && <TypingIndicator />}
            {error && (
              <div className="chat-error" role="alert">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="ai-chat-form" onSubmit={handleSubmit}>
        <div className="ai-chat-input-wrap">
          <textarea
            ref={textareaRef}
            className="ai-chat-input"
            value={input}
            rows={1}
            placeholder="Ask about this PR…"
            disabled={loading}
            onChange={(e) => {
              setInput(e.target.value);
              growTextarea();
            }}
            onKeyDown={handleKeyDown}
            aria-label="Chat message"
          />
          <button
            type="submit"
            className="ai-chat-send"
            disabled={!canSend}
            aria-label="Send message"
          >
            <ArrowUp size={15} />
          </button>
        </div>
        <p className="ai-chat-hint">
          Enter to send · Shift+Enter for newline
        </p>
      </form>
    </section>
  );
}
