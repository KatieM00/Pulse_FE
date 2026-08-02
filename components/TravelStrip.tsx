"use client";

import { TravelSignal } from "@/lib/types";

interface Props {
  signals: TravelSignal[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function TravelStrip({ signals }: Props) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 14,
        border: "0.5px solid rgba(0,0,0,0.10)",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          padding: "10px 14px 6px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderBottom: "0.5px solid rgba(0,0,0,0.06)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#1D9E75",
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#4B5563",
            textTransform: "uppercase",
            letterSpacing: 0.6,
          }}
        >
          Travel right now
        </span>
      </div>
      {signals.map((signal, i) => (
        <div
          key={signal.id}
          style={{
            padding: "10px 14px",
            borderBottom:
              i < signals.length - 1 ? "0.5px solid rgba(0,0,0,0.06)" : "none",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#1A1A1A",
              marginBottom: 2,
            }}
          >
            {signal.headline}
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.4 }}>
            {signal.detail}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "#9CA3AF",
              display: "flex",
              gap: 6,
            }}
          >
            <span>{signal.source}</span>
            <span aria-hidden="true">·</span>
            <span>
              <time dateTime={signal.timestamp}>{timeAgo(signal.timestamp)}</time>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
