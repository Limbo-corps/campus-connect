// @/lib/chat/socket.ts
import type { ChatEvent } from "@/types";
import { debugGroup } from "@/lib/debug";

/**
 * Resolve the WebSocket endpoint for the chat consumer.
 *
 * Prefers NEXT_PUBLIC_WS_URL, otherwise derives it from NEXT_PUBLIC_API_URL by
 * stripping the trailing `/api` and swapping the http(s) scheme for ws(s). The
 * Channels routing mounts the consumer at `/ws/chat/` on the server root.
 */
function resolveWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;

  const api = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  const base = api.replace(/\/api\/?$/, "");
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/ws/chat/`;
}

type Listener = (event: ChatEvent) => void;
type StatusListener = (connected: boolean) => void;

/**
 * A resilient client-side WebSocket wrapper for the chat consumer.
 *
 * - Authenticates by appending the JWT access token as a `?token=` query param
 *   (browsers cannot set custom headers on a WS handshake).
 * - Automatically reconnects with capped exponential backoff, re-reading the
 *   token on each attempt so a refreshed token is picked up.
 * - Sends a lightweight `ping` keepalive so idle proxies don't drop the socket.
 * - Fans incoming events out to subscribers.
 */
export class ChatSocket {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private closedByUser = false;

  private readonly url = resolveWsUrl();
  private readonly getToken: () => string | null;

  constructor(getToken: () => string | null) {
    this.getToken = getToken;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect() {
    if (typeof window === "undefined") return;
    this.closedByUser = false;

    const token = this.getToken();
    if (!token) return; // nothing to authenticate with yet

    // Avoid stacking sockets.
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const ws = new WebSocket(`${this.url}?token=${encodeURIComponent(token)}`);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitStatus(true);
      this.startPing();
    };

    ws.onmessage = (raw) => {
      let parsed: ChatEvent;
      try {
        parsed = JSON.parse(raw.data);
      } catch {
        return;
      }
      if (parsed?.event === "pong") return;
      this.listeners.forEach((fn) => fn(parsed));
    };

    ws.onclose = () => {
      this.stopPing();
      this.emitStatus(false);
      this.ws = null;
      if (!this.closedByUser) this.scheduleReconnect();
    };

    ws.onerror = () => {
      // onclose fires right after; reconnection is handled there.
      ws.close();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    // 1s, 2s, 4s ... capped at 30s.
    const delay = Math.min(30_000, 1000 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send({ action: "ping" });
    }, 25_000);
  }

  private stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /** Notify the server that the user is (or has stopped) typing. */
  sendTyping(conversationId: string, isTyping: boolean) {
    debugGroup("sendTyping", conversationId, isTyping);
    this.send({
      action: "typing",
      conversation: conversationId,
      is_typing: isTyping,
    });
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: StatusListener): () => void {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }

  private emitStatus(connected: boolean) {
    this.statusListeners.forEach((fn) => fn(connected));
  }

  close() {
    this.closedByUser = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopPing();
    this.ws?.close();
    this.ws = null;
  }
}
