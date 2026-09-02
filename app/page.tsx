"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EVENTS } from "@/lib/data";
import EventRow from "@/components/EventRow";
import HomeFeed from "@/components/HomeFeed";
import { getDemoScenario } from "@/lib/api";

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
  const demoScenario = useMemo(() => getDemoScenario(demoParam), [demoParam]);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // When the URL carries a demo=<id> parameter, prime the search box
  // with that scenario's primary prompt so the user can type freely
  // and Pulse knows which curated evidence set to assemble against.
  // The previous typed value is cleared first so back-navigation into
  // the page does not replay a stale entry.
  useEffect(() => {
    const input = searchInputRef.current;
    if (!input) return;
    if (demoScenario) {
      input.value = demoScenario.primary_prompt;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    } else {
      input.value = "";
    }
  }, [demoScenario]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const input = searchInputRef.current;
    if (!input) return;
    const trimmed = input.value.trim();
    if (trimmed) {
      // Clear the DOM value synchronously, before the App Router
      // snapshots this page for its cache. The router-back flow
      // restores the cached DOM, so any state-only reset would be
      // overwritten on the next visit. Setting the input value
      // here lands the cleared state into the cache snapshot.
      input.value = "";
      input.blur();
      const params = new URLSearchParams({ q: trimmed });
      if (demoScenario) params.set("demo", demoScenario.id);
      router.push(`/chat?${params.toString()}`);
    }
  }

  return (
    <div style={{ background: "#ffffff", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
      {/* Top nav */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 12px",
          background: "#ffffff",
          borderBottom: "0.5px solid rgba(0,0,0,0.07)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: "#1A1A1A",
          }}
        >
          Pulse
        </span>
        <button
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
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
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* ── Slide-in menu ───────────────────────────────────────────────── */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={() => setMenuOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 200,
            }}
          />

          {/* Drawer */}
          <nav
            aria-label="Site menu"
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 260,
              background: "#ffffff",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
              zIndex: 201,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Drawer header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px 12px",
                borderBottom: "0.5px solid rgba(0,0,0,0.07)",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.4, color: "#1A1A1A" }}>
                Menu
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                style={{
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 8,
                  color: "#6B7280",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Menu items */}
            <div style={{ flex: 1, padding: "8px 12px" }}>
              {[
                { href: "/how-it-works", icon: "💡", label: "How Pulse Works" },
                { href: "/integrate",    icon: "🔌", label: "Integrate Pulse" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 10px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: "#1A1A1A",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}

      {/* Hero */}
      <section style={{ padding: "32px 20px 20px", textAlign: "center" }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#1A1A1A",
            margin: "0 0 8px 0",
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}
        >
          What&apos;s the vibe today?
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6B7280",
            margin: "0 0 24px 0",
            lineHeight: 1.5,
          }}
        >
          Live from radio, news and social, across Barbados.
        </p>

        {/* Single, larger search control with embedded submit */}
        <form onSubmit={handleSearch} role="search">
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
            Search Pulse
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
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
          >
            <input
              id="pulse-search"
              ref={searchInputRef}
              type="search"
              defaultValue=""
              placeholder="Ask Pulse anything"
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
                margin: "4px",
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

      {/* Live feed */}
      <div style={{ padding: "8px 16px 0" }}>
        <header
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            margin: "0 4px 10px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: "#1A1A1A",
            }}
          >
            What&apos;s on now?
          </h2>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#9CA3AF",
            }}
          >
            Latest source-backed signals across Barbados
          </span>
        </header>
        <HomeFeed limit={8} />
      </div>

      {/* Body content */}
      <div style={{ padding: "16px 16px 24px" }}>
        {/* Events toggle — fixtures only until #14/#17 land live events. */}
        <section aria-label="Upcoming events">
          <button
            onClick={() => setEventsExpanded((v) => !v)}
            aria-expanded={eventsExpanded}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "0.5px solid rgba(239,159,39,0.35)",
              background: "#ffffff",
              color: "#1A1A1A",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Click to view upcoming events</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6B7280"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{
                transform: eventsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {eventsExpanded && (
            <div style={{ marginTop: 12 }}>
              {EVENTS.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
