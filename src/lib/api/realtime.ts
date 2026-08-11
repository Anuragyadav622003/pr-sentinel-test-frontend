/**
 * realtime.ts
 * WebSocket-primary live updates with an exponential-backoff polling fallback.
 *
 * The backend processes reviews asynchronously (BullMQ), so a PR's status
 * progresses RECEIVED → PROCESSING → REVIEWED | FAILED over time. This module
 * pushes those transitions to the UI as fast as the backend allows:
 *
 *   1. Prefer a WebSocket connection when NEXT_PUBLIC_WS_URL (or an API URL we
 *      can derive one from) is reachable.
 *   2. Fall back to polling with exponential backoff whenever the socket is
 *      unavailable, errors, or closes.
 *
 * The socket is never trusted for authoritative data — it only signals that
 * something changed, prompting the SWR cache to revalidate against the REST
 * endpoint (the source of truth).
 */

import { API_URL } from "./client";

/** Derive a ws(s):// base URL from the configured API URL. */
function resolveWsUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  if (!API_URL) return null;
  try {
    const url = new URL(API_URL);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    // Strip a trailing "/api" so we hit the socket gateway root.
    url.pathname = url.pathname.replace(/\/api\/?$/, "");
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

interface SubscribeOptions {
  /** Called when the backend signals this PR may have changed. */
  onChange: () => void;
  /** Reports whether the live socket is currently connected (for UI hints). */
  onConnectionChange?: (connected: boolean) => void;
}

/**
 * Subscribe to change signals for a single pull request over WebSocket.
 * Returns an unsubscribe function. If the socket can't be established, the
 * caller should rely on its polling fallback — this resolves `false` in that
 * case so callers can decide, but it also self-heals via reconnect attempts.
 */
export function subscribeToPullRequest(
  pullRequestId: string,
  { onChange, onConnectionChange }: SubscribeOptions
): () => void {
  const wsBase = resolveWsUrl();
  if (!wsBase || typeof WebSocket === "undefined") {
    return () => {};
  }

  let socket: WebSocket | null = null;
  let closedByCaller = false;
  let reconnectDelay = 1000;
  const maxReconnectDelay = 30000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closedByCaller) return;
    try {
      socket = new WebSocket(wsBase);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      reconnectDelay = 1000;
      onConnectionChange?.(true);
      try {
        socket?.send(
          JSON.stringify({
            type: "subscribe",
            channel: "pull-request",
            pullRequestId,
          })
        );
      } catch {
        /* ignore send errors — reconnect logic will handle a dead socket */
      }
    };

    socket.onmessage = (event) => {
      // Any message that references this PR (or is a broadcast) triggers a
      // revalidation. We deliberately keep parsing lenient.
      try {
        const payload = JSON.parse(event.data as string) as {
          pullRequestId?: string;
          id?: string;
          type?: string;
        };
        const ref = payload.pullRequestId ?? payload.id;
        if (!ref || ref === pullRequestId) onChange();
      } catch {
        onChange();
      }
    };

    socket.onerror = () => {
      onConnectionChange?.(false);
      socket?.close();
    };

    socket.onclose = () => {
      onConnectionChange?.(false);
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (closedByCaller || reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay);
      connect();
    }, reconnectDelay);
  };

  connect();

  return () => {
    closedByCaller = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    onConnectionChange?.(false);
    try {
      socket?.close();
    } catch {
      /* noop */
    }
  };
}

/**
 * Exponential-backoff interval calculator for SWR's refreshInterval.
 * Polls quickly at first, then slows down, capping at `max`. Returns 0 (no
 * polling) once the PR reaches a terminal state.
 */
export function pollingInterval(params: {
  isTerminal: boolean;
  attempt: number;
  live: boolean;
}): number {
  if (params.isTerminal) return 0;
  // When the live socket is connected we still keep a slow safety-net poll.
  const base = params.live ? 15000 : 3000;
  const max = params.live ? 30000 : 20000;
  return Math.min(base * Math.pow(1.5, Math.max(0, params.attempt)), max);
}
