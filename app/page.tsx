"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENTS, TRAVEL_SIGNALS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";
import { Category } from "@/lib/types";
import EventRow from "@/components/EventRow";
import FilterPill from "@/components/FilterPill";
import TravelStrip from "@/components/TravelStrip";

const ALL_CATEGORIES: Category[] = ["soca", "beach", "music", "culture", "market"];

export default function HomePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredEvents = selectedCategory
    ? EVENTS.filter((e) => e.category === selectedCategory)
    : EVENTS;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/chat?q=${encodeURIComponent(searchValue.trim())}`);
    }
  }

  function handleWhatsOn() {
    router.push("/chat?q=What%27s+on+today%3F");
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

      {/* Hero */}
      <section style={{ padding: "32px 20px 24px", textAlign: "center" }}>
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
          What&apos;s the vibe tonight?
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#6B7280",
            margin: "0 0 24px 0",
            lineHeight: 1.5,
          }}
        >
          Live from radio, news and social, across the Caribbean.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} role="search">
          <div style={{ position: "relative", marginBottom: 14 }}>
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
            <input
              id="pulse-search"
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Ask Pulse anything"
              style={{
                width: "100%",
                padding: "13px 46px 13px 16px",
                borderRadius: 12,
                border: "0.5px solid rgba(0,0,0,0.15)",
                fontSize: 15,
                color: "#1A1A1A",
                background: "#FAFAFA",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            />
            <button
              type="submit"
              aria-label="Search"
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 6,
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={handleWhatsOn}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 12,
              border: "2px solid #EF9F27",
              background: "#ffffff",
              color: "#1A1A1A",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              letterSpacing: -0.1,
            }}
          >
            What&apos;s on today?
          </button>
        </form>
      </section>

      {/* Filter row */}
      <section aria-label="Category filters" style={{ padding: "0 0 0 20px", marginBottom: 20 }}>
        <div
          className="scrollbar-hide"
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingRight: 20,
            paddingBottom: 4,
          }}
        >
          {ALL_CATEGORIES.map((cat) => (
            <FilterPill
              key={cat}
              category={cat}
              selected={selectedCategory === cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
            />
          ))}
        </div>
      </section>

      {/* Body content */}
      <div style={{ padding: "0 16px" }}>
        {/* Travel strip */}
        <TravelStrip signals={TRAVEL_SIGNALS} />

        {/* Events toggle */}
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
              marginBottom: eventsExpanded ? 12 : 0,
            }}
          >
            <span>
              Click to view upcoming events
              {selectedCategory && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: CATEGORY_COLORS[selectedCategory],
                    fontWeight: 600,
                  }}
                >
                  · {CATEGORY_LABELS[selectedCategory]}
                </span>
              )}
            </span>
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
            <div style={{ marginTop: 8 }}>
              {filteredEvents.length === 0 ? (
                <p
                  style={{
                    fontSize: 14,
                    color: "#9CA3AF",
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  No events in this category right now.
                </p>
              ) : (
                filteredEvents.map((event) => (
                  <EventRow key={event.id} event={event} />
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
