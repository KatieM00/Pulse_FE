"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FeedItem,
  SourceKind,
  SourceRef,
} from "@/lib/types";
import styles from "./SourceList.module.css";

const BARBADOS_TZ = "America/Barbados";

/**
 * Normalised card shape consumed by the shared ``SourceCard`` UI.
 *
 * Issue #30 (``FeedItem``) and issue #26 (``SourceRef``) share the
 * same visual + media behaviour; the union keeps the component free of
 * Chat-only semantics (``n``, ``reason``) on the Home feed while the
 * Chat caller keeps its citation look.
 */
export interface SourceCardData {
  /** Stable, unique-per-list id. Citation number when present. */
  id: number | string;
  kind: SourceKind;
  url: string;
  /** Card title (station name, social handle, page title). */
  title: string | null;
  /** Host or "FM broadcast" attribution. */
  publisher: string | null;
  /** Optional card caption; the radio station uses the slug as fallback. */
  label?: string;
  captured_at: string | null;
  segment_at?: string | null;
  thumbnail_url: string | null;
  embed: string;
  /** Two-line body text shown on the Home feed (radio chunk / article excerpt). */
  excerpt?: string | null;
  /** Chat-only: query-specific relevance sentence. */
  reason?: string | null;
  /** Radio-only: station frequency in MHz. */
  station_frequency_mhz?: number | null;
  /** Chat-only: shown as "related" when the card was not cited inline. */
  uncited?: boolean;
}

export function sourceCardFromChat(src: SourceRef): SourceCardData {
  return {
    id: src.n,
    kind: src.kind,
    url: src.url,
    title: src.title ?? null,
    publisher: src.publisher ?? null,
    label: src.label,
    captured_at: src.captured_at ?? null,
    segment_at: src.segment_at ?? null,
    thumbnail_url: src.thumbnail_url ?? null,
    embed: src.embed,
    reason: src.reason ?? null,
    station_frequency_mhz: src.station_frequency_mhz ?? null,
    uncited: src.uncited,
  };
}

export function sourceCardFromFeed(item: FeedItem): SourceCardData {
  return {
    id: `${item.source_type}:${item.url}`,
    kind: item.kind,
    url: item.url,
    title: item.title ?? null,
    publisher: item.publisher ?? null,
    label: item.label,
    captured_at: item.captured_at ?? null,
    segment_at: item.segment_at ?? null,
    thumbnail_url: item.thumbnail_url ?? null,
    embed: item.embed,
    excerpt: item.text,
    station_frequency_mhz: item.station_frequency_mhz ?? null,
  };
}

function _barbadosDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BARBADOS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function formatDate(capturedAt: string | null | undefined): string {
  if (!capturedAt) return "";
  // Date-only API values describe a Barbados calendar date, not midnight UTC.
  const value = /^\d{4}-\d{2}-\d{2}$/.test(capturedAt)
    ? `${capturedAt}T12:00:00Z`
    : capturedAt;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const capturedKey = _barbadosDateKey(date);
  const now = new Date();
  const todayKey = _barbadosDateKey(now);
  if (capturedKey === todayKey) return "Today";

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (capturedKey === _barbadosDateKey(yesterday)) return "Yesterday";

  return new Intl.DateTimeFormat("en-BB", {
    timeZone: BARBADOS_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatBroadcastTime(segmentAt: string | null | undefined): string {
  if (!segmentAt || !segmentAt.includes("T")) return "";
  const date = new Date(segmentAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BB", {
    timeZone: BARBADOS_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type Badge =
  | { kind: "tiktok" }
  | { kind: "instagram" }
  | { kind: "youtube" }
  | { kind: "radio"; stationName: string; frequency: number | null }
  | { kind: "pulse" }
  | { kind: "web" };

function badgeFor(source: SourceCardData): Badge {
  if (source.kind === "radio") {
    return {
      kind: "radio",
      stationName: source.title || source.label || "Radio",
      frequency: source.station_frequency_mhz ?? null,
    };
  }
  if (source.kind === "tiktok") return { kind: "tiktok" };
  if (source.kind === "instagram") return { kind: "instagram" };
  if (source.kind === "youtube") return { kind: "youtube" };
  if (source.kind === "internal") return { kind: "pulse" };
  return { kind: "web" };
}

function BadgeChip({ badge }: { badge: Badge }) {
  const iconSize = 10;
  switch (badge.kind) {
    case "tiktok":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#1A1A1A"
              d="M16.5 3a5 5 0 0 0 4.5 4.5v3a8 8 0 0 1-4.5-1.4v6.9a6 6 0 1 1-6-6c.34 0 .67.03 1 .09v3.05a3 3 0 1 0 2 2.81V3h3Z"
            />
          </svg>
          TikTok
        </span>
      );
    case "instagram":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="#1A1A1A" strokeWidth="1.8" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="#1A1A1A" strokeWidth="1.8" />
            <circle cx="17.5" cy="6.5" r="1" fill="#1A1A1A" />
          </svg>
          Instagram
        </span>
      );
    case "youtube":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="3" fill="#1A1A1A" />
            <polygon points="10,8 16,12 10,16" fill="#ffffff" />
          </svg>
          YouTube
        </span>
      );
    case "radio":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 14a8 8 0 0 1 16 0M7 14a5 5 0 0 1 10 0M10 14a2 2 0 0 1 4 0"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="14" r="1.5" fill="#1A1A1A" />
          </svg>
          Radio
        </span>
      );
    case "pulse":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#1A1A1A" strokeWidth="1.8" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="#1A1A1A" strokeWidth="1.4" />
          </svg>
          Pulse
        </span>
      );
    case "web":
      return (
        <span className={styles.previewBadge}>
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="#1A1A1A" strokeWidth="1.8" />
            <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="#1A1A1A" strokeWidth="1.4" />
          </svg>
          Web
        </span>
      );
  }
}

function RadioStationArt({
  badge,
}: {
  badge: Extract<Badge, { kind: "radio" }>;
}) {
  const freq = badge.frequency;
  return (
    <div className={styles.previewStation}>
      <span className={styles.previewStationName}>
        {badge.stationName
          .replace(/\s+\d+(\.\d+)?(?:\s*FM)?$/i, "")
          .slice(0, 14)}
      </span>
      {freq != null && (
        <span className={styles.previewFrequency}>{freq.toFixed(1)}</span>
      )}
      <span className={styles.previewStationName} style={{ fontSize: 10, opacity: 0.7 }}>
        FM
      </span>
    </div>
  );
}

function PreviewImage({
  thumbnailUrl,
  alt,
}: {
  thumbnailUrl: string | null;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!thumbnailUrl || failed) return null;
  return (
    /* Static export runs images unoptimized; preview hosts are
       dynamic and ephemeral so next/image adds nothing here. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      className={styles.previewImage}
      src={thumbnailUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function RadioPlayer({
  embed,
  activeClipKey,
  myKey,
  onPlay,
}: {
  embed: string;
  activeClipKey: string | null;
  myKey: string;
  onPlay: (key: string) => void;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (activeClipKey && activeClipKey !== myKey && !el.paused) {
      el.pause();
    }
  }, [activeClipKey, myKey]);

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      return;
    }
    onPlay(myKey);
    void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }

  return (
    <>
      <button
        type="button"
        className={styles.previewPlay}
        onClick={toggle}
        aria-label={isPlaying ? `Pause radio clip` : `Play radio clip`}
        aria-pressed={isPlaying}
      >
        <span className={styles.playCircle}>
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="2" y="2" width="3" height="10" fill="currentColor" />
              <rect x="9" y="2" width="3" height="10" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <polygon points="3,2 12,7 3,12" fill="currentColor" />
            </svg>
          )}
        </span>
      </button>
      {isPlaying && (
        <div className={styles.radioProgress} aria-hidden="true">
          <div
            className={styles.previewProgressFill}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}
      <audio
        ref={ref}
        src={embed}
        preload="metadata"
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          if (audio.duration > 0) {
            setProgressPct((audio.currentTime / audio.duration) * 100);
          }
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setProgressPct(0);
        }}
        onError={() => setIsPlaying(false)}
      />
    </>
  );
}

function PreviewArea({
  source,
  badge,
}: {
  source: SourceCardData;
  badge: Badge;
}) {
  const alt = `${source.title || source.label || "source"} preview`;
  return (
    <div className={styles.preview}>
      {badge.kind === "radio" ? (
        <RadioStationArt badge={badge} />
      ) : (
        <>
          <PreviewImage thumbnailUrl={source.thumbnail_url} alt={alt} />
          {badge.kind === "tiktok" && (
            <div className={styles.previewGlyph} aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
                <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.45)" />
                <polygon points="10,8 17,12 10,16" />
              </svg>
            </div>
          )}
        </>
      )}
      <BadgeChip badge={badge} />
    </div>
  );
}

export type SourceCardVariant = "chat" | "feed";

export interface SourceCardProps {
  source: SourceCardData;
  variant: SourceCardVariant;
  activeClipKey: string | null;
  onPlayClip: (key: string) => void;
}

export function SourceCard({
  source,
  variant,
  activeClipKey,
  onPlayClip,
}: SourceCardProps) {
  const cardKey = `${source.kind}:${source.id}:${source.embed}`;
  const linked = source.url.startsWith("http");
  const host = linked ? hostname(source.url) : "";
  const sourceTimestamp = source.kind === "radio"
    ? source.segment_at || source.captured_at
    : source.captured_at;
  const dateLabel = formatDate(sourceTimestamp);
  const broadcastTime = source.kind === "radio"
    ? formatBroadcastTime(sourceTimestamp)
    : "";
  const titleText = source.title || source.label || "Source";
  const badge = badgeFor(source);

  // Two-line, comma-joined attribution: "@laurenjohiggins · TikTok"
  const attributionParts: string[] = [];
  if (source.publisher) attributionParts.push(source.publisher);
  else if (host) attributionParts.push(host);
  else if (source.kind === "internal") attributionParts.push("Pulse Barbados");
  if (badge.kind === "web" && !source.publisher && host) {
    attributionParts.push(host);
  }
  const attribution = attributionParts.join(" · ");

  const showReason = variant === "chat" && !!source.reason;
  const excerptText = variant === "feed" ? source.excerpt : null;

  const inner = (
    <>
      <PreviewArea source={source} badge={badge} />
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className={styles.title}>{titleText}</div>
          {dateLabel && (
            <time className={styles.date} dateTime={sourceTimestamp || undefined}>
              <span>{dateLabel}</span>
              {broadcastTime && (
                <span className={styles.broadcastTime}>Aired {broadcastTime}</span>
              )}
            </time>
          )}
        </div>
        {attribution && <div className={styles.attribution}>{attribution}</div>}
        {excerptText && (
          <div className={styles.reason}>
            {excerptText}
          </div>
        )}
        {showReason && (
          <div className={styles.reason}>
            <span
              className={styles.reasonIcon}
              role="img"
              aria-label="Why this source matched"
              title="Why this source matched"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="5.5" />
                <path d="m14.2 14.2 4.3 4.3" />
                <path d="m18 3.5.7 2.3L21 6.5l-2.3.7L18 9.5l-.7-2.3L15 6.5l2.3-.7L18 3.5Z" />
              </svg>
            </span>
            {source.reason}
          </div>
        )}
      </div>
      {variant === "chat" && source.uncited ? (
        <span className={styles.related}>related</span>
      ) : (
        <span className={styles.chevron} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      )}
    </>
  );

  if (linked) {
    return (
      <div className={styles.card}>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          title={titleText}
          className={styles.cardLink}
        >
          {inner}
        </a>
        {source.kind === "radio" && source.embed && (
          <RadioPlayer
            embed={source.embed}
            activeClipKey={activeClipKey}
            myKey={cardKey}
            onPlay={onPlayClip}
          />
        )}
      </div>
    );
  }
  return (
    <div className={styles.card}>
      <div className={styles.cardLink}>{inner}</div>
    </div>
  );
}

export const VISIBLE_COUNT = 8;

export interface SourceListProps {
  sources: SourceRef[];
}

export default function SourceList({ sources }: SourceListProps) {
  const [activeClipKey, setActiveClipKey] = useState<string | null>(null);

  // Stop any active radio clip when the list unmounts.
  useEffect(() => () => setActiveClipKey(null), []);

  const handlePlayClip = useCallback((key: string) => {
    setActiveClipKey(key);
  }, []);

  if (sources.length === 0) return null;
  const cited = sources.filter((s) => !s.uncited);
  const uncited = sources.filter((s) => s.uncited);
  const ordered = [...cited, ...uncited];

  return (
    <div className={styles.list} aria-label="Sources for this answer">
      <div className={styles.header}>
        <span>Sources</span>
        <span className={styles.count}>
          {ordered.length} {ordered.length === 1 ? "result" : "results"}
        </span>
      </div>
      {ordered.map((src) => (
        <SourceCard
          key={`${src.kind}-${src.n}`}
          source={sourceCardFromChat(src)}
          variant="chat"
          activeClipKey={activeClipKey}
          onPlayClip={handlePlayClip}
        />
      ))}
    </div>
  );
}
