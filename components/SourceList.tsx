"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SourceRef } from "@/lib/types";
import styles from "./SourceList.module.css";

const VISIBLE_COUNT = 4;

interface Props {
  sources: SourceRef[];
}

const SCREEN_READER_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
};

/** Returns a short Barbados-locale date string for the captured_at
 * timestamp, or an empty string when the value is missing or invalid. */
function formatCaptured(capturedAt: string | null | undefined): string {
  if (!capturedAt) return "";
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-BB", {
    timeZone: "America/Barbados",
    day: "numeric",
    month: "short",
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

/** Small horizontal bar visual used as the radio station fallback artwork. */
function RadioWaveform() {
  const bars = [4, 10, 6, 14, 8, 18, 12, 7, 16, 9, 5, 11];
  return (
    <div className={styles.fallbackWaveform} aria-hidden="true">
      {bars.map((height, idx) => (
        <span key={idx} style={{ height: `${height * 3}px` }} />
      ))}
    </div>
  );
}

function FallbackGlyph({ letter }: { letter: string }) {
  return <div className={styles.fallbackGlyph}>{letter.toUpperCase()}</div>;
}

function Preview({
  src,
  alt,
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  fallback: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return (
    /* Static export runs images unoptimized; preview hosts are dynamic
       and ephemeral so next/image adds nothing here. */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      className={styles.previewImage}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

const BADGE_TEXT: Record<SourceRef["kind"], string> = {
  radio: "Radio",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  link: "Web",
  internal: "Source",
};

function PreviewArea({ source }: { source: SourceRef }) {
  const fallbackLetter = (source.title || source.label || "?").charAt(0);
  const alt = `${BADGE_TEXT[source.kind]} preview for ${source.title || source.label}`;

  let fallback: React.ReactNode;
  if (source.kind === "radio") {
    fallback = (
      <>
        <RadioWaveform />
        <div className={styles.fallbackGlyph} style={{ fontSize: 16 }}>
          ◉ FM
        </div>
      </>
    );
  } else if (source.kind === "tiktok") {
    fallback = <FallbackGlyph letter="♪" />;
  } else if (source.kind === "instagram") {
    fallback = <FallbackGlyph letter="◎" />;
  } else if (source.kind === "youtube") {
    fallback = <FallbackGlyph letter="▶" />;
  } else {
    fallback = <FallbackGlyph letter={fallbackLetter} />;
  }

  return (
    <div className={styles.preview} aria-hidden={source.kind === "radio" ? undefined : true}>
      <Preview src={source.thumbnail_url} alt={alt} fallback={fallback} />
      <div className={styles.previewBadge}>{BADGE_TEXT[source.kind]}</div>
      {source.kind === "radio" && source.station_frequency_mhz != null && (
        <div className={styles.previewFrequency}>
          {source.station_frequency_mhz.toFixed(1)}
        </div>
      )}
    </div>
  );
}

/** Inline audio player; one-at-a-time enforcement is handled by
 * the parent <SourceList> via shared state. */
function RadioPlayer({
  src,
  activeKey,
  myKey,
  onPlay,
}: {
  src: string;
  activeKey: string | null;
  myKey: string;
  onPlay: (key: string) => void;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (activeKey && activeKey !== myKey && !el.paused) {
      el.pause();
    }
  }, [activeKey, myKey]);

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
    <div className={styles.player}>
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? `Pause radio clip` : `Play radio clip`}
        aria-pressed={isPlaying}
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          border: "none",
          background: isPlaying ? "#EF9F27" : "#1A1A1A",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        {isPlaying ? (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <rect x="1" y="1" width="3" height="8" fill="currentColor" />
            <rect x="6" y="1" width="3" height="8" fill="currentColor" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
            <polygon points="2,1 9,5 2,9" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className={styles.playerTime} aria-live="off">
        {formatClock(elapsed)}
      </span>
      <div
        className={styles.playerProgress}
        role="progressbar"
        aria-label="Clip progress"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={elapsed}
      >
        <div
          className={styles.playerProgressFill}
          style={{
            width: duration > 0 ? `${(elapsed / duration) * 100}%` : "0%",
          }}
        />
      </div>
      <span className={styles.playerTime}>{formatClock(duration)}</span>
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) =>
          setDuration((e.currentTarget.duration || 0) | 0)
        }
        onTimeUpdate={(e) => setElapsed((e.currentTarget.currentTime || 0) | 0)}
        onEnded={() => {
          setIsPlaying(false);
          setElapsed(0);
        }}
        onError={() => setIsPlaying(false)}
      />
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function SourceCard({
  source,
  activeClipKey,
  onPlayClip,
}: {
  source: SourceRef;
  activeClipKey: string | null;
  onPlayClip: (key: string) => void;
}) {
  const cardKey = `${source.kind}:${source.n}:${source.embed}`;
  const linked = source.url.startsWith("http");
  const host = linked ? hostname(source.url) : "";
  const captured = formatCaptured(source.captured_at);
  const showCitation = !source.uncited;
  const titleText = source.title || source.label;
  const attribution =
    source.publisher ||
    (host ? host : null) ||
    (source.kind === "internal" ? "Pulse source" : null);

  const cardBody = (
    <>
      <PreviewArea source={source} />
      <div className={styles.body}>
        <div className={styles.title}>{titleText}</div>
        {(attribution || captured) && (
          <div className={styles.attribution}>
            {[attribution, captured].filter(Boolean).join(" · ")}
          </div>
        )}
        {source.reason && (
          <>
            <div className={styles.reasonLabel}>Why this was returned</div>
            <div className={styles.reason}>{source.reason}</div>
          </>
        )}
      </div>
      {showCitation && (
        <span className={styles.citation} aria-label={`Citation number ${source.n}`}>
          [{source.n}]
        </span>
      )}
      {source.uncited && (
        <span className={styles.related} style={{ position: "absolute", top: 10, right: 12 }}>
          related
        </span>
      )}
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {linked ? (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          title={titleText}
          className={styles.card}
        >
          {cardBody}
        </a>
      ) : (
        <div className={styles.card}>{cardBody}</div>
      )}
      {source.kind === "radio" && source.embed && (
        <div style={{ marginTop: 6 }}>
          <RadioPlayer
            src={source.embed}
            activeKey={activeClipKey}
            myKey={cardKey}
            onPlay={onPlayClip}
          />
        </div>
      )}
    </div>
  );
}

export default function SourceList({ sources }: Props) {
  const [activeClipKey, setActiveClipKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Stop any active radio clip when the list unmounts so audio does
  // not keep playing in the background.
  useEffect(() => () => setActiveClipKey(null), []);

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
          {ordered.length} {ordered.length === 1 ? "source" : "sources"}
        </span>
      </div>
      {visible.map((src) => (
        <SourceCard
          key={`${src.kind}-${src.n}`}
          source={src}
          activeClipKey={activeClipKey}
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