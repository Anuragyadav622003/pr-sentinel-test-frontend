"use client";

import { useMemo } from "react";
import type { ReviewComment, Severity } from "@/lib/api/types";

type DiffLine = {
  key: string;
  kind: "add" | "del" | "ctx" | "meta";
  oldNum: number | null;
  newNum: number | null;
  text: string;
  highlighted?: Severity;
};

function parsePatch(
  patch: string,
  highlights: Map<number, Severity>,
): DiffLine[] {
  const lines: DiffLine[] = [];
  let oldLine = 0;
  let newLine = 0;
  const rawLines = patch.split("\n");

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? "";

    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = Number(match[1]);
        newLine = Number(match[2]);
      }
      lines.push({
        key: `meta-${i}`,
        kind: "meta",
        oldNum: null,
        newNum: null,
        text: line,
      });
      continue;
    }

    if (line.startsWith("+")) {
      const sev = highlights.get(newLine);
      lines.push({
        key: `add-${i}`,
        kind: "add",
        oldNum: null,
        newNum: newLine,
        text: line.slice(1),
        highlighted: sev,
      });
      newLine += 1;
      continue;
    }

    if (line.startsWith("-")) {
      lines.push({
        key: `del-${i}`,
        kind: "del",
        oldNum: oldLine,
        newNum: null,
        text: line.slice(1),
      });
      oldLine += 1;
      continue;
    }

    if (line.startsWith("\\")) {
      lines.push({
        key: `ctx-${i}`,
        kind: "meta",
        oldNum: null,
        newNum: null,
        text: line,
      });
      continue;
    }

    lines.push({
      key: `ctx-${i}`,
      kind: "ctx",
      oldNum: oldLine,
      newNum: newLine,
      text: line.startsWith(" ") ? line.slice(1) : line,
    });
    oldLine += 1;
    newLine += 1;
  }

  return lines;
}

function severityClass(severity?: Severity) {
  if (!severity) return "";
  const map: Record<Severity, string> = {
    CRITICAL: "diff-highlight-critical",
    HIGH: "diff-highlight-high",
    MEDIUM: "diff-highlight-medium",
    LOW: "diff-highlight-low",
  };
  return map[severity];
}

function lineSign(kind: DiffLine["kind"]) {
  if (kind === "add") return "+";
  if (kind === "del") return "−";
  return " ";
}

export function DiffViewer({
  patch,
  findings = [],
}: {
  patch: string | null | undefined;
  findings?: ReviewComment[];
}) {
  const highlights = useMemo(() => {
    const map = new Map<number, Severity>();
    for (const f of findings) {
      if (f.lineNumber != null && f.severity) {
        map.set(f.lineNumber, f.severity);
      }
    }
    return map;
  }, [findings]);

  const lines = useMemo(
    () => (patch ? parsePatch(patch, highlights) : []),
    [patch, highlights],
  );

  if (!patch) {
    return (
      <div className="diff-empty">
        <p>No diff available for this file.</p>
        <small>The patch was not stored or the file has no content changes.</small>
      </div>
    );
  }

  return (
    <div className="diff-scroll-wrap" role="region" aria-label="File diff">
      <table className="diff-table">
        <tbody>
          {lines.map((line) =>
            line.kind === "meta" ? (
              <tr key={line.key} className="diff-row diff-row-meta">
                <td colSpan={3} className="diff-hunk">
                  {line.text}
                </td>
              </tr>
            ) : (
              <tr
                key={line.key}
                className={`diff-row diff-row-${line.kind} ${severityClass(line.highlighted)}`}
              >
                <td className="diff-gutter diff-gutter-old">{line.oldNum ?? ""}</td>
                <td className="diff-gutter diff-gutter-new">{line.newNum ?? ""}</td>
                <td className="diff-code">
                  <span className={`diff-sign diff-sign-${line.kind}`} aria-hidden>
                    {lineSign(line.kind)}
                  </span>
                  <code className="diff-code-text">{line.text || " "}</code>
                  {line.highlighted && (
                    <span className={`diff-finding-pill ${severityClass(line.highlighted)}`}>
                      {line.highlighted}
                    </span>
                  )}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
