"use client";

import { useMemo } from "react";
import type { ReviewComment, Severity } from "@/lib/api/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiffLine = {
  key: string;
  kind: "add" | "del" | "ctx" | "meta";
  oldNum: number | null;
  newNum: number | null;
  text: string;
  findings: ReviewComment[];
};

// ─── Parser ───────────────────────────────────────────────────────────────────

function parsePatch(patch: string, findingsByLine: Map<number, ReviewComment[]>): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (let i = 0, raw = patch.split("\n"); i < raw.length; i++) {
    const line = raw[i] ?? "";

    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) { oldLine = Number(m[1]); newLine = Number(m[2]); }
      lines.push({ key: `meta-${i}`, kind: "meta", oldNum: null, newNum: null, text: line, findings: [] });
      continue;
    }
    if (line.startsWith("\\")) {
      lines.push({ key: `noeol-${i}`, kind: "meta", oldNum: null, newNum: null, text: line, findings: [] });
      continue;
    }
    if (line.startsWith("+")) {
      const n = newLine;
      lines.push({ key: `add-${i}`, kind: "add", oldNum: null, newNum: n, text: line.slice(1), findings: findingsByLine.get(n) ?? [] });
      newLine++;
      continue;
    }
    if (line.startsWith("-")) {
      lines.push({ key: `del-${i}`, kind: "del", oldNum: oldLine, newNum: null, text: line.slice(1), findings: [] });
      oldLine++;
      continue;
    }
    lines.push({ key: `ctx-${i}`, kind: "ctx", oldNum: oldLine, newNum: newLine, text: line.startsWith(" ") ? line.slice(1) : line, findings: [] });
    oldLine++;
    newLine++;
  }
  return lines;
}

// ─── Severity helpers ─────────────────────────────────────────────────────────

function topSeverity(findings: ReviewComment[]): Severity | null {
  const order: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  for (const s of order) {
    if (findings.some((f) => f.severity === s)) return s;
  }
  return null;
}

function severityRowClass(sev: Severity): string {
  return `diff-highlight-${sev.toLowerCase()}`;
}

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: "var(--sev-critical)",
  HIGH:     "var(--sev-high)",
  MEDIUM:   "var(--sev-medium)",
  LOW:      "var(--sev-low)",
};

// ─── DiffViewer ───────────────────────────────────────────────────────────────

export function DiffViewer({
  patch,
  findings = [],
  onFindingClick,
}: {
  patch: string | null | undefined;
  findings?: ReviewComment[];
  /** Called when user clicks a finding pill — useful to jump to findings tab */
  onFindingClick?: (finding: ReviewComment) => void;
}) {
  const findingsByLine = useMemo(() => {
    const map = new Map<number, ReviewComment[]>();
    for (const f of findings) {
      if (f.lineNumber != null) {
        if (!map.has(f.lineNumber)) map.set(f.lineNumber, []);
        map.get(f.lineNumber)!.push(f);
      }
    }
    return map;
  }, [findings]);

  const lines = useMemo(
    () => (patch ? parsePatch(patch, findingsByLine) : []),
    [patch, findingsByLine],
  );

  if (!patch) {
    return (
      <div className="diff-empty" role="region" aria-label="No diff available">
        <p>No diff available for this file.</p>
        <small>The patch was not stored or the file has no content changes.</small>
      </div>
    );
  }

  return (
    <div className="diff-scroll-wrap" role="region" aria-label="File diff">
      <table className="diff-table" aria-label="Code diff">
        <tbody>
          {lines.map((line) => {
            if (line.kind === "meta") {
              return (
                <tr key={line.key} className="diff-row diff-row-meta">
                  <td colSpan={3} className="diff-hunk">{line.text}</td>
                </tr>
              );
            }

            const top = line.findings.length > 0 ? topSeverity(line.findings) : null;
            const rowCls = [
              "diff-row",
              `diff-row-${line.kind}`,
              top ? severityRowClass(top) : "",
            ].join(" ").trim();

            return (
              <tr key={line.key} className={rowCls}>
                <td className="diff-gutter diff-gutter-old" aria-hidden>
                  {line.oldNum ?? ""}
                </td>
                <td className="diff-gutter diff-gutter-new" aria-hidden>
                  {line.newNum ?? ""}
                </td>
                <td className="diff-code">
                  <span
                    className={`diff-sign ${line.kind === "add" ? "add" : line.kind === "del" ? "del" : ""}`}
                    aria-hidden
                  >
                    {line.kind === "add" ? "+" : line.kind === "del" ? "−" : " "}
                  </span>
                  <code className="diff-code-text">{line.text || " "}</code>
                  {/* Finding pills — one per finding on this line */}
                  {line.findings.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="diff-finding-pill"
                      style={{
                        background: f.severity ? `${SEV_COLOR[f.severity]}22` : undefined,
                        color: f.severity ? SEV_COLOR[f.severity] : undefined,
                        border: `1px solid ${f.severity ? SEV_COLOR[f.severity] : "transparent"}44`,
                        cursor: onFindingClick ? "pointer" : "default",
                      }}
                      title={f.message}
                      aria-label={`${f.severity} finding: ${f.message}`}
                      onClick={() => onFindingClick?.(f)}
                    >
                      {f.severity ?? "FINDING"}
                    </button>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
