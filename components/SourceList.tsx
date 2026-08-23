"use client";

import { SourceRef } from "@/lib/types";
import MediaEmbed from "./MediaEmbed";

interface Props {
  sources: SourceRef[];
}

const KIND_ICONS: Record<string, string> = {
  radio: "📻",
  tiktok: "🎵",
  instagram: "📸",
  youtube: "▶️",
  link: "🔗",
  internal: "📄",
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * Numbered source list under an assistant reply. Numbers match the [n]
 * citations the answer model emitted; rich sources render inline embeds.
 */
export default function SourceList({ sources }: Props) {
  if (sources.length === 0) return null;
  return (
    <div
      style={{
        margin: "2px 0 16px 0",
        padding: "10px 12px",
        borderRadius: 12,
        border: "0.5px solid rgba(0,0,0,0.08)",
        background: "#FAFAFA",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#9CA3AF",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Sources
      </div>
      {sources.map((src) => (
        <div key={src.n} style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              fontSize: 12,
              color: "#6B7280",
            }}
          >
            <span style={{ fontWeight: 700, color: "#1A1A1A", flexShrink: 0 }}>
              [{src.n}]
            </span>
            <span style={{ flexShrink: 0 }} aria-hidden="true">
              {KIND_ICONS[src.kind] ?? "🔗"}
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>{src.label}</span>
            {src.url.startsWith("http") && (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#EF9F27",
                  fontWeight: 600,
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                {hostname(src.url)} ↗
              </a>
            )}
          </div>
          <MediaEmbed source={src} />
        </div>
      ))}
    </div>
  );
}
