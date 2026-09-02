"use client";

import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChatMessage, SourceRef, AskProgressEvent } from "@/lib/types";
import { askPulseStream } from "@/lib/api";
import EventRow from "@/components/EventRow";
import SourceList from "@/components/SourceList";
import ToolProgress from "@/components/ToolProgress";

const SUGGESTIONS = [
  "What's on today?",
  "Any soca events this week?",
  "Where and when is the circus?",
  "What's happening at the beach?",
];

/**
 * Defence-in-depth gate for legacy V2 source cards.
 *
 * The V2 path can still surface "internal" sources whose URL is an
 * absolute filesystem path (``file:///Users/matt/...``) left over from
 * the local travel corpus. Those URLs cannot be opened in production
 * and the cards used to render as broken links. Hide any non-http
 * source and any source whose kind is ``internal``.
 */
function _isOpenableSource(src: SourceRef): boolean {
  if (src.kind === "internal") return false;
  if (!src.url || !src.url.startsWith("http")) return false;
  return true;
}

type AnswerSegment =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string };

function parseAnswerSegments(text: string): AnswerSegment[] {
  const segments: AnswerSegment[] = [];
  const pattern = /\*\*([^*\n][^*\n]*?)\*\*|\*([^*\n]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    const value = (match[1] ?? match[2] ?? "").trim();
    if (value) segments.push({ kind: "bold", value });
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }
  if (segments.length === 0) segments.push({ kind: "text", value: text });
  return segments;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const seededRef = useRef<string | null>(null);
  const sendingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const appendEvent = useCallback(
    (pendingId: string, event: AskProgressEvent) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== pendingId) return m;
          const progress = [...(m.progress ?? []), event];
          const finalised = event.type === "done" || event.type === "error";
          let text = m.text;
          let sources = m.sources;
          let warnings = m.warnings;
          if (event.type === "done") {
            sources = stripUnopenableSources(event.response.sources);
            text = event.response.answer || text;
            warnings = event.response.warnings ?? [];
          }
          return { ...m, progress, finalised, text, sources, warnings };
        }),
      );
    },
    [],
  );

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sendingRef.current) return;
    sendingRef.current = true;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };
    const pendingId = `msg-assistant-pending-${Date.now()}`;
    const pendingMsg: ChatMessage = {
      id: pendingId,
      role: "assistant",
      text: "",
      progress: [],
      finalised: false,
    };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInputValue("");
    setSending(true);

    const history = messagesRef.current
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => m.text && !m.text.startsWith("Looking through"))
      .slice(-8)
      .map((m) => ({ role: m.role, text: m.text }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const final = await askPulseStream(trimmed, history, {
        signal: controller.signal,
        onProgress: (event) => appendEvent(pendingId, event),
      });
      const composerDown =
        (final.warnings ?? []).some((w) =>
          (w ?? "").includes("composer"),
        ) || (final.error ?? "").includes("composer");
      const answerText =
        final.answer ||
        "I don't have any source-backed evidence for that yet — signals are still coming in.";
      const finalText = composerDown
        ? "I couldn't reach the Ask composer right now. Try again in a moment."
        : answerText;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                id: `msg-assistant-${Date.now()}`,
                text: finalText,
                sources: stripUnopenableSources(final.sources),
                warnings: final.warnings ?? [],
                finalised: true,
              }
            : m,
        ),
      );
    } catch (err) {
      const detail = err instanceof Error ? err.message : "";
      const friendly = detail.includes("too long")
        ? "That question is a bit long — try trimming it to a couple of sentences."
        : detail.includes("missing question")
          ? "Please ask a question."
        : detail.startsWith("planner_unavailable")
          ? "I couldn't reach the Ask planner right now. Try again in a moment."
        : detail.startsWith("composer_unavailable")
          ? "I couldn't reach the Ask composer right now. Try again in a moment."
        : "Sorry — I couldn't reach the Pulse service just now. Try again in a moment.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                id: `msg-assistant-${Date.now()}`,
                text: friendly,
                finalised: true,
              }
            : m,
        ),
      );
    } finally {
      abortRef.current = null;
      sendingRef.current = false;
      setSending(false);
    }
  }, [appendEvent]);

  useEffect(() => {
    if (!initialQ) return;
    if (seededRef.current === initialQ) return;
    seededRef.current = initialQ;
    messagesRef.current = [];
    setMessages([]);
    void sendMessage(initialQ);
  }, [initialQ, sendMessage]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    const node = nodeRefs.current[last.id];
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, sending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(inputValue);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px 12px",
          background: "#ffffff",
          borderBottom: "0.5px solid rgba(0,0,0,0.07)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            borderRadius: 10,
            flexShrink: 0,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1A1A1A",
              letterSpacing: -0.3,
            }}
          >
            Pulse Concierge
          </div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>
            Live answers from radio, news and social
          </div>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
        aria-live="polite"
        aria-label="Conversation"
      >
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 16px 0" }}>
            <div
              style={{ fontSize: 36, marginBottom: 12, color: "#EF9F27" }}
              aria-hidden="true"
            >
              ◉
            </div>
            <p
              style={{
                fontSize: 15,
                color: "#6B7280",
                lineHeight: 1.6,
                maxWidth: 280,
                margin: "0 auto 24px",
              }}
            >
              Ask me what&apos;s on, where something is, or what&apos;s being
              talked about — answers come from live radio, news and social,
              and I&apos;ll show you what I&apos;m checking as I go.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void sendMessage(s)}
                  style={{
                    padding: "11px 16px",
                    borderRadius: 12,
                    border: "0.5px solid rgba(0,0,0,0.12)",
                    background: "#FAFAFA",
                    color: "#374151",
                    fontSize: 13,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => {
              nodeRefs.current[msg.id] = el;
            }}
          >
            {msg.role === "assistant" && !msg.finalised ? (
              <div style={{ marginBottom: 12 }}>
                <ToolProgress message={msg} />
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom:
                  msg.role === "assistant" &&
                  (msg.events?.length || msg.sources?.length)
                    ? 8
                    : 12,
              }}
            >
              <div
                style={{
                  maxWidth: msg.role === "user" ? "82%" : "100%",
                  padding: msg.role === "user" ? "10px 14px" : "12px 16px",
                  borderRadius:
                    msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "#1A1A1A" : "#F3F4F6",
                  color: msg.role === "user" ? "#ffffff" : "#1A1A1A",
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.id.startsWith("msg-assistant-pending-") &&
                !msg.finalised ? null : (
                  parseAnswerSegments(msg.text).map((segment, idx) =>
                    segment.kind === "bold" ? (
                      <strong key={idx}>{segment.value}</strong>
                    ) : (
                      <span key={idx}>{segment.value}</span>
                    ),
                  )
                )}
              </div>
            </div>

            {msg.role === "assistant" && msg.events && msg.events.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {msg.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}

            {msg.role === "assistant" &&
              msg.sources &&
              msg.sources.length > 0 && (
                <SourceList sources={(msg.sources || []).filter(_isOpenableSource)} />
              )}
          </div>
        ))}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      <div
        style={{
          padding: "10px 12px 14px",
          background: "#ffffff",
          borderTop: "0.5px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      >
        <form
          onSubmit={handleSubmit}
          role="search"
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <label
            htmlFor="chat-input"
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              overflow: "hidden",
              clip: "rect(0,0,0,0)",
              whiteSpace: "nowrap",
            }}
          >
            Ask Pulse anything
          </label>
          <input
            id="chat-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Pulse anything"
            autoComplete="off"
            disabled={sending}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 12,
              border: "0.5px solid rgba(0,0,0,0.15)",
              fontSize: 15,
              color: "#1A1A1A",
              background: "#FAFAFA",
              outline: "none",
              minHeight: 46,
            }}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!inputValue.trim() || sending}
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: "2px solid #EF9F27",
              background: inputValue.trim() && !sending ? "#EF9F27" : "#ffffff",
              cursor: inputValue.trim() && !sending ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={inputValue.trim() && !sending ? "#ffffff" : "#EF9F27"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

function stripUnopenableSources(sources: SourceRef[] | undefined): SourceRef[] {
  if (!Array.isArray(sources)) return [];
  return sources.filter((src) => {
    if (src.kind === "internal") return false;
    if (!src.url || !/^https?:\/\//i.test(src.url)) return false;
    return true;
  });
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          Loading...
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}