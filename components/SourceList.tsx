"use client";

import { useState } from "react";
import { SourceRef } from "@/lib/types";
import MediaEmbed from "./MediaEmbed";

interface Props {
  sources: SourceRef[];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Small rounded site glyph: real favicon when available, letter tile otherwise. */
function SiteTile({ src, letter }: { src: string | null; letter: string }) {
  const [failed, setFailed] = useState(false);
  const tile: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 8,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#F3F4F6",
    color: "#6B7280",
    fontSize: 13,
    fontWeight: 700,
    overflow: "hidden",
  };
  if (src && !failed) {
    return (
      <span style={tile}>
        {/* Static export runs images unoptimized; next/image adds
            nothing for an 18px favicon. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          width={18}
          height={18}
          onError={() => setFailed(true)}
          style={{ display: "block" }}
        />
      </span>
    );
  }
  return <span style={tile}>{letter}</span>;
}

const TITLE_STYLE: React.CSSProperties = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
  color: "#1A1A1A",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.4,
};

const DOMAIN_STYLE: React.CSSProperties = {
  display: "block",
  marginTop: 2,
  color: "#EF9F27",
  fontSize: 12,
  fontWeight: 600,
  textDecoration: "none",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

/**
 * Numbered source cards under an assistant reply. Numbers match the [n]
 * citations the answer model emitted; uncited "related" cards carry no
 * number since no prose citation points at them. Rich sources render
 * inline embeds.
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
      {sources.map((src) => {
        const linked = src.url.startsWith("http");
        const host = linked ? hostname(src.url) : "";
        const favicon = host
          ? `https://www.google.com/s2/favicons?domain=${host}&sz=64`
          : null;
        const letter = (host || src.label || "?").charAt(0).toUpperCase();
        const body = (
          <>
            {!src.uncited && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: linked ? "#9CA3AF" : "#C4C7CC",
                  flexShrink: 0,
                  paddingTop: 1,
                }}
              >
                [{src.n}]
              </span>
            )}
            <SiteTile src={favicon} letter={letter} />
            {src.uncited && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#EF9F27",
                  border: "1px solid rgba(239,159,39,0.5)",
                  borderRadius: 6,
                  padding: "0 5px",
                  flexShrink: 0,
                  alignSelf: "center",
                  lineHeight: "16px",
                }}
              >
                related
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  ...TITLE_STYLE,
                  color: linked ? "#1A1A1A" : "#6B7280",
                }}
              >
                {src.label}
              </span>
              {linked && <span style={DOMAIN_STYLE}>{host} ↗</span>}
            </span>
          </>
        );
        return (
          <div
            key={src.n}
            style={{
              marginBottom: 8,
              borderRadius: 12,
              border: "0.5px solid rgba(0,0,0,0.08)",
              background: "#ffffff",
              padding: "10px 12px",
            }}
          >
            {linked ? (
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                title={src.label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  textDecoration: "none",
                }}
              >
                {body}
              </a>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                {body}
              </div>
            )}
            <MediaEmbed source={src} />
          </div>
        );
      })}
    </div>
  );
}
