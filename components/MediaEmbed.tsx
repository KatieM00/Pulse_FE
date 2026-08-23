"use client";

import { SourceRef } from "@/lib/types";

interface Props {
  source: SourceRef;
}

const EMBED_FRAME: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 12,
  overflow: "hidden",
  display: "block",
  background: "#F9FAFB",
};

/**
 * Renders an inline preview for a cited source: playable audio for radio
 * snippets, native iframes for social posts, nothing for plain links.
 */
export default function MediaEmbed({ source }: Props) {
  switch (source.kind) {
    case "radio":
      if (!source.embed) return null;
      return (
        <audio
          controls
          preload="metadata"
          src={source.embed}
          style={{ width: "100%", marginTop: 6, height: 36 }}
        />
      );
    case "tiktok":
      return (
        <iframe
          src={`https://www.tiktok.com/embed/v2/${source.embed}`}
          title={`TikTok video ${source.embed}`}
          loading="lazy"
          allowFullScreen
          allow="encrypted-media"
          style={{ ...EMBED_FRAME, height: 560, marginTop: 6 }}
        />
      );
    case "instagram":
      return (
        <iframe
          src={`https://www.instagram.com/p/${source.embed}/embed`}
          title={`Instagram post ${source.embed}`}
          loading="lazy"
          allowFullScreen
          style={{ ...EMBED_FRAME, height: 480, marginTop: 6 }}
        />
      );
    case "youtube":
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${source.embed}`}
          title={`YouTube video ${source.embed}`}
          loading="lazy"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{ ...EMBED_FRAME, aspectRatio: "16/9", marginTop: 6 }}
        />
      );
    default:
      return null;
  }
}
