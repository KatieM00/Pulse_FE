"use client";

import { useState } from "react";
import Image from "next/image";
import { Event } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";
import ConfidenceDot from "./ConfidenceDot";
import CategoryChip from "./CategoryChip";

interface Props {
  event: Event;
}

const SOURCE_ICONS: Record<string, string> = {
  radio: "📻",
  newspaper: "📰",
  tiktok: "🎵",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-BB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventRow({ event }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = CATEGORY_COLORS[event.category];

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "0.5px solid rgba(0,0,0,0.10)",
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`View details for ${event.title}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          padding: "12px 14px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          minHeight: 64,
        }}
      >
        {/* Thumbnail or chip */}
        <span style={{ flexShrink: 0 }}>
          {event.poster_url ? (
            <span
              style={{
                display: "block",
                width: 44,
                height: 44,
                borderRadius: 10,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <Image
                src={event.poster_url}
                alt={event.title}
                width={44}
                height={44}
                style={{ objectFit: "cover", borderRadius: 10 }}
                unoptimized
              />
            </span>
          ) : (
            <CategoryChip category={event.category} size="sm" />
          )}
        </span>

        {/* Text block */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontWeight: 600,
              fontSize: 14,
              color: "#1A1A1A",
              lineHeight: 1.3,
              marginBottom: 3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {event.title}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "#6B7280",
              overflow: "hidden",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 10 }}>
              📍
            </span>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {event.location}
            </span>
          </span>
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "#9CA3AF",
              marginTop: 2,
            }}
          >
            {formatDate(event.date)}
          </span>
        </span>

        {/* Right-side meta */}
        <span
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 5,
            flexShrink: 0,
          }}
        >
          <ConfidenceDot label={event.confidence.label} />
          <span
            style={{
              fontSize: 11,
              color: color,
              fontWeight: 500,
            }}
          >
            {CATEGORY_LABELS[event.category]}
          </span>
          {event.event_link && (
            <span
              aria-label="Has external link"
              style={{ fontSize: 11, color: "#9CA3AF" }}
            >
              ↗
            </span>
          )}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          style={{
            borderTop: "0.5px solid rgba(0,0,0,0.08)",
            padding: "14px 14px 16px",
          }}
        >
          {event.poster_url && (
            <div
              style={{
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 12,
                width: "100%",
                aspectRatio: "16/9",
                position: "relative",
                background: "#f3f3f3",
              }}
            >
              <Image
                src={event.poster_url}
                alt={`${event.title} poster`}
                fill
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
          )}

          <p
            style={{
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.6,
              margin: "0 0 12px 0",
            }}
          >
            {event.summary}
          </p>

          {/* Sources */}
          <div style={{ marginBottom: 12 }}>
            {event.sources.map((src, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, flexShrink: 0 }}>
                  {SOURCE_ICONS[src.type]}
                </span>
                <span style={{ fontSize: 11, color: "#6B7280" }}>
                  <strong style={{ fontWeight: 600, color: "#4B5563" }}>
                    {src.name}
                  </strong>{" "}
                  — &quot;{src.excerpt}&quot;
                </span>
              </div>
            ))}
          </div>

          {/* Ticket note */}
          <div
            style={{
              fontSize: 12,
              color: "#6B7280",
              background: "#F9FAFB",
              borderRadius: 8,
              padding: "8px 10px",
              marginBottom: 12,
            }}
          >
            🎟 {event.ticket_note}
          </div>

          {/* CTA */}
          {event.event_link && (
            <a
              href={event.event_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "10px 16px",
                border: `2px solid ${color}`,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 600,
                color: "#1A1A1A",
                textDecoration: "none",
                background: "#ffffff",
              }}
            >
              View event / get tickets ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
