"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SourceRef } from "@/lib/types";
import styles from "./SourceList.module.css";

const VISIBLE_COUNT = 4;

const SCREEN_READER_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
};

const BARBADOS_TZ = "America/Barbados";

function formatDate(capturedAt: string | null | undefined): string {
  if (!capturedAt) return "";
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BB", {
    timeZone: BARBADOS_TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
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

function badgeFor(source: SourceRef): Badge {
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
  isPlaying,
  progressPct,
}: {
  badge: Extract<Badge, { kind: "radio" }>;
  isPlaying: boolean;
  progressPct: number;
}) {
  const freq = badge.frequency;
  return (
    <>
      <div className={styles.previewStation}>
        <span className={styles.previewStationName}>
          {badge.stationName.replace(/\s+\d+(\.\d+)?\s*$/, "").slice(0, 14)}
        </span>
        {freq != null && (
          <span className={styles.previewFrequency}>{freq.toFixed(1)}</span>
        )}
        <span className={styles.previewStationName} style={{ fontSize: 10, opacity: 0.7 }}>
          FM
        </span>
      </div>
      {isPlaying && (
        <div className={styles.previewProgress} aria-hidden="true">
          <div
            className={styles.previewProgressFill}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>
      )}
    </>
  );
}

function PreviewImage({
  source,
  alt,
}: {
  source: SourceRef;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!source.thumbnail_url || failed) return null;
  return (
    /* Static export runs images unoptimized; preview hosts are
       dynamic and ephemeral so next/image adds nothing here. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      className={styles.previewImage}
      src={source.thumbnail_url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

function RadioPlayer({
  source,
  activeClipKey,
  myKey,
  onPlay,
}: {
  source: SourceRef;
  activeClipKey: string | null;
  myKey: string;
  onPlay: (key: string) => void;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (activeClipKey && activeClipKey !== myKey && !el.paused) {
      el.pause();
    }
  }, [activeClipKey, myKey]);

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    // Prevent the wrapping card link from triggering navigation.
    e.preventDefault();
    e.stopPropagation();
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
      <audio
        ref={ref}
        src={source.embed}
        preload="metadata"
        onTimeUpdate={() => {}}
        onEnded={() => {
          setIsPlaying(false);
        }}
        onError={() => setIsPlaying(false)}
      />
    </>
  );
}

function PreviewArea({
  source,
  badge,
  activeClipKey,
  myKey,
  onPlayClip,
  isPlayingThisCard,
  progressPct,
}: {
  source: SourceRef;
  badge: Badge;
  activeClipKey: string | null;
  myKey: string;
  onPlayClip: (key: string) => void;
  isPlayingThisCard: boolean;
  progressPct: number;
}) {
  const alt = `${(source.title || source.label) ?? "source"} preview`;
  return (
    <div className={styles.preview}>
      {badge.kind === "radio" ? (
        <RadioStationArt
          badge={badge}
          isPlaying={isPlayingThisCard}
          progressPct={progressPct}
        />
      ) : (
        <>
          <PreviewImage source={source} alt={alt} />
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
      {badge.kind === "radio" && source.embed && (
        <RadioPlayer
          source={source}
          activeClipKey={activeClipKey}
          myKey={myKey}
          onPlay={onPlayClip}
        />
      )}
    </div>
  );
}

function SourceCard({
  source,
  activeClipKey,
  progressPct,
  playingKey,
  onPlayClip,
}: {
  source: SourceRef;
  activeClipKey: string | null;
  progressPct: number;
  playingKey: string | null;
  onPlayClip: (key: string) => void;
}) {
  const cardKey = `${source.kind}:${source.n}:${source.embed}`;
  const linked = source.url.startsWith("http");
  const host = linked ? hostname(source.url) : "";
  const dateLabel = formatDate(source.captured_at);
  const titleText = source.title || source.label;
  const badge = badgeFor(source);
  const isPlayingThisCard = playingKey === cardKey;

  // Two-line, comma-joined attribution: "@laurenjohiggins • TikTok"
  const attributionParts: string[] = [];
  if (source.publisher) attributionParts.push(source.publisher);
  else if (host) attributionParts.push(host);
  else if (source.kind === "internal") attributionParts.push("Pulse Barbados");
  if (badge.kind === "web" && !source.publisher && host) {
    attributionParts.push(host);
  }
  const attribution = attributionParts.join(" · ");

  const inner = (
    <>
      <PreviewArea
        source={source}
        badge={badge}
        activeClipKey={activeClipKey}
        myKey={cardKey}
        onPlayClip={onPlayClip}
        isPlayingThisCard={isPlayingThisCard}
        progressPct={progressPct}
      />
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className={styles.title}>{titleText}</div>
          {dateLabel && (
            <time className={styles.date} dateTime={source.captured_at || undefined}>
              {dateLabel}
            </time>
          )}
        </div>
        {attribution && <div className={styles.attribution}>{attribution}</div>}
        {source.reason && (
          <div className={styles.reason}>
            <span className={styles.reasonLabel}>Why this was returned: </span>
            {source.reason}
          </div>
        )}
      </div>
      {source.uncited ? (
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
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        title={titleText}
        className={styles.card}
      >
        {inner}
      </a>
    );
  }
  return <div className={styles.card}>{inner}</div>;
}

export default function SourceList({ sources }: { sources: SourceRef[] }) {
  const [activeClipKey, setActiveClipKey] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [expanded, setExpanded] = useState(false);

  // Stop any active radio clip when the list unmounts.
  useEffect(() => () => setActiveClipKey(null), []);

  // Drive a lightweight global progress ticker so any card can show
  // its current playback position. Only one clip ever plays at a time.
  useEffect(() => {
    if (!activeClipKey) return;
    let raf = 0;
    const tick = () => {
      const audios = document.querySelectorAll("audio");
      let pct = 0;
      for (const a of Array.from(audios)) {
        const el = a as HTMLAudioElement;
        if (!el.paused && el.duration > 0) {
          pct = (el.currentTime / el.duration) * 100;
          break;
        }
      }
      setProgressPct(pct);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [activeClipKey]);

  const handlePlayClip = useCallback((key: string) => {
    setActiveClipKey(key);
  }, []);

  if (sources.length === 0) return null;
  const cited = sources.filter((s) => !s.uncited);
  const uncited = sources.filter((s) => s.uncited);
  const ordered = [...cited, ...uncited];

  const visible = expanded ? ordered : ordered.slice(0, VISIBLE_COUNT);
  const remaining = ordered.length - visible.length;

  return (
    <div className={styles.list} aria-label="Sources for this answer">
      <div className={styles.header}>
        <span>Sources</span>
        <span className={styles.count}>
          {ordered.length} {ordered.length === 1 ? "result" : "results"}
        </span>
      </div>
      {visible.map((src) => (
        <SourceCard
          key={`${src.kind}-${src.n}`}
          source={src}
          activeClipKey={activeClipKey}
          progressPct={progressPct}
          playingKey={activeClipKey}
          onPlayClip={handlePlayClip}
        />
      ))}
      {remaining > 0 && (
        <button
          type="button"
          className={styles.moreButton}
          onClick={() => setExpanded(true)}
          aria-expanded={expanded}
        >
          Show {remaining} more {remaining === 1 ? "source" : "sources"}
          <span style={SCREEN_READER_ONLY}>
            {" "}
            (expands the list of sources below)
          </span>
        </button>
      )}
    </div>
  );
}