"use client";

import { Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9CA3AF",
            fontSize: 14,
            background: "#ffffff",
          }}
        >
          Loading…
        </div>
      }
    >
      <HomePageInner />
    </Suspense>
  );
}

function HomePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoParam = searchParams.get("demo");
  const searchInputRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const input = searchInputRef.current;
    if (!input) return;
    const trimmed = input.value.trim();
    if (!trimmed) return;
    input.value = "";
    input.blur();
    const params = new URLSearchParams({ q: trimmed });
    if (demoParam) params.set("demo", demoParam);
    router.push(`/chat?${params.toString()}`);
  }

  return (
    <div style={{ background: "var(--bg)", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      {/* Hero — question-first, no feed */}
      <section
        style={{
          padding: "64px 20px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "0 0 6px 0",
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}
        >
          What&apos;s happening in Barbados?
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6B7280",
            margin: "0 0 20px 0",
            lineHeight: 1.5,
          }}
        >
          Live from radio, news and social, with sources you can inspect.
        </p>

        <form
          onSubmit={handleSearch}
          role="search"
          style={{ marginBottom: 16 }}
        >
          <label
            htmlFor="pulse-search"
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
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "stretch",
              minHeight: 56,
              borderRadius: 14,
              border: "0.5px solid rgba(0,0,0,0.15)",
              background: "#FAFAFA",
            }}
          >
            <input
              id="pulse-search"
              ref={searchInputRef}
              type="search"
              defaultValue=""
              placeholder="Ask Pulse anything about Barbados"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "0 16px",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 16,
                color: "#1A1A1A",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
            <button
              type="submit"
              aria-label="Search"
              style={{
                width: 56,
                minWidth: 44,
                minHeight: 44,
                margin: 4,
                borderRadius: 10,
                border: "none",
                background: "#EF9F27",
                color: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </form>
      </section>

      {/* Beta status — short, honest, not an apology. */}
      <section
        style={{
          padding: "20px 20px 32px",
          margin: "0 auto",
          maxWidth: 480,
        }}
      >
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "#6B7280",
            background: "rgba(0,0,0,0.03)",
            border: "0.5px solid rgba(0,0,0,0.06)",
            borderRadius: 10,
            padding: "10px 14px",
            margin: 0,
            textAlign: "center",
          }}
        >
          <strong style={{ color: "#374151", fontWeight: 600 }}>Beta</strong>{" "}
          · Coverage is improving daily. Every answer links back to the source it came
          from — always check them. Spotted a problem?{" "}
          <a
            href="mailto:hello@pulsebarbados.com?subject=Pulse%20beta%20feedback"
            style={{ color: "#F1366F", textDecoration: "none", fontWeight: 500 }}
          >
            Report it
          </a>
          .
        </p>
      </section>
    </div>
  );
}
