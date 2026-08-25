"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/lib/types";
import { askPulse } from "@/lib/api";
import EventRow from "@/components/EventRow";
import SourceList from "@/components/SourceList";

const SUGGESTIONS = [
  "What's on today?",
  "Any soca events this week?",
  "Where and when is the circus?",
  "What's happening at the beach?",
];

// Shown in the assistant bubble while the pipeline runs — one per source
// it searches, in a fixed order so the cycle reads as a little tour.
const STATUS_MESSAGES = [
  "Listening to the airwaves…",
  "Twiddling the radio dial…",
  "Tiking the toks…",
  "Checking the 'Gram…",
  "Bingeing YouTube for clues…",
  "Leafing through Ins & Outs…",
  "Asking Visit Barbados…",
  "Scanning the events calendar…",
  "Checking where the lime is at…",
  "Consulting the coconut wireless…",
  "Asking around the rum shop…",
  "Putting out feelers…",
];

const STATUS_INTERVAL_MS = 2200;

const SCREEN_READER_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
};

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
  const seededRef = useRef(false);
  const sendingRef = useRef(false);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Don't leak the status cycle if the page unmounts mid-ask.
  useEffect(
    () => () => {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
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
      text: STATUS_MESSAGES[0],
    };
    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setInputValue("");
    setSending(true);

    // Cycle the tour-of-sources status while the pipeline runs.
    let statusIndex = 0;
    statusTimerRef.current = setInterval(() => {
      statusIndex = (statusIndex + 1) % STATUS_MESSAGES.length;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, text: STATUS_MESSAGES[statusIndex] }
            : m,
        ),
      );
    }, STATUS_INTERVAL_MS);

    try {
      const result = await askPulse(trimmed);
      const answerText =
        result.answer ||
        "I don't have any source-backed evidence for that yet — signals are still coming in.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { ...m, id: `msg-assistant-${Date.now()}`, text: answerText, sources: result.sources }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                ...m,
                id: `msg-assistant-${Date.now()}`,
                text: "Sorry — I couldn't reach the Pulse service just now. Try again in a moment.",
              }
            : m,
        ),
      );
    } finally {
      if (statusTimerRef.current) {
        clearInterval(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      sendingRef.current = false;
      setSending(false);
    }
  }, []);

  // Seed conversation from URL param on mount
  useEffect(() => {
    if (initialQ && !seededRef.current) {
      seededRef.current = true;
      void sendMessage(initialQ);
    }
  }, [initialQ, sendMessage]);

  // Keep the conversation pinned to the user's question + the assistant
  // bubble they just sent. Don't auto-scroll when results land: the user
  // already saw the question and should stay oriented to the chat input.
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "user") return;
    const node = nodeRefs.current[last.id];
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
    // messages is intentionally read via length + last index to avoid
    // re-scrolling on every state mutation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, sending]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(inputValue);
  }

  return (
    /* Full-height flex column — fills the <main> exactly */
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#ffffff",
      }}
    >
      {/* ── Header ── */}
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

      {/* ── Scrollable conversation ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
        }}
        aria-live="polite"
        aria-label="Conversation"
      >
        {/* Empty state */}
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
              talked about — answers come from live radio, news and social.
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

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            ref={(el) => {
              nodeRefs.current[msg.id] = el;
            }}
          >
            {/* Chat bubble */}
            <div
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: msg.role === "assistant" && (msg.events?.length || msg.sources?.length) ? 8 : 12,
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
                {msg.id.startsWith("msg-assistant-pending-") ? (
                  <>
                    <span aria-hidden="true">{msg.text}</span>
                    <span style={SCREEN_READER_ONLY}>Searching Pulse sources</span>
                  </>
                ) : (
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

            {/* Event rows below assistant reply */}
            {msg.role === "assistant" && msg.events && msg.events.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {msg.events.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Numbered sources with embeds below assistant reply */}
            {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
              <SourceList sources={msg.sources} />
            )}
          </div>
        ))}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* ── Input bar ── */}
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
