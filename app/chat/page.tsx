"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/lib/types";
import { buildInitialMessages, getConciergeResponse } from "@/lib/concierge";
import EventRow from "@/components/EventRow";

const SUGGESTIONS = [
  "What's on today?",
  "Any soca events this week?",
  "How do I get tickets?",
  "What's happening at the beach?",
];

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Seed conversation from URL param on mount
  useEffect(() => {
    if (initialQ) {
      setMessages(buildInitialMessages(initialQ));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      text: text.trim(),
    };
    const result = getConciergeResponse(text.trim());
    const assistantMsg: ChatMessage = {
      id: `msg-assistant-${Date.now()}`,
      role: "assistant",
      text: result.text,
      events: result.events,
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInputValue("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(inputValue);
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
            Ask me anything about Caribbean events
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
              Ask me what&apos;s on, how to get tickets, or how to get to an event.
            </p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
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
          <div key={msg.id}>
            {/* Chat bubble */}
            <div
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: msg.role === "assistant" && msg.events?.length ? 8 : 12,
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "#1A1A1A" : "#F3F4F6",
                  color: msg.role === "user" ? "#ffffff" : "#1A1A1A",
                  fontSize: 14,
                  lineHeight: 1.55,
                }}
              >
                {msg.text}
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
            disabled={!inputValue.trim()}
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: "2px solid #EF9F27",
              background: inputValue.trim() ? "#EF9F27" : "#ffffff",
              cursor: inputValue.trim() ? "pointer" : "default",
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
              stroke={inputValue.trim() ? "#ffffff" : "#EF9F27"}
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
