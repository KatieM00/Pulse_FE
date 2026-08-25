"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RecommendationEvidence,
  RecommendationOption,
  SourceKind,
  SourceRef,
} from "@/lib/types";
import styles from "./RecommendationCard.module.css";

const BARBADOS_TZ = "America/Barbados";

export const VISIBLE_REC_COUNT = 6;

function formatWhen(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BB", {
    timeZone: BARBADOS_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTimeRange(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BB", {
    timeZone: BARBADOS_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function humaniseFacet(facet: string): string {
  return facet.replace(/_/g, " ");
}

function hostFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || "";
    return host.replace(/^www\./, "");
  } catch (error) {
    return null;
  }
}

const KNOWN_SOURCE_KINDS: ReadonlyArray<SourceKind> = [
  "radio",
  "tiktok",
  "instagram",
  "youtube",
  "link",
  "internal",
];

function normaliseKind(sourceType: string | null | undefined): SourceKind {
  const value = (sourceType ?? "").toLowerCase();
  if ((KNOWN_SOURCE_KINDS as ReadonlyArray<string>).includes(value)) {
    return value as SourceKind;
  }
  if (value === "youtube_video") return "youtube";
  return "link";
}

function sourceLabel(ev: RecommendationEvidence): string {
  if (ev.title && ev.title.trim().length > 0) return ev.title.trim();
  if (ev.publisher && ev.publisher.trim().length > 0) return ev.publisher.trim();
  return ev.source_type.replace(/_/g, " ");
}

function recommendationEvidenceToSourceRefs(
  option: RecommendationOption,
): SourceRef[] {
  const evidence = option.evidence ?? [];
  const refs: SourceRef[] = [];
  for (let idx = 0; idx < evidence.length; idx += 1) {
    const ev = evidence[idx];
    if (!ev.url || ev.url.length === 0) continue;
    const label = sourceLabel(ev);
    const isRadio = ev.source_type === "radio";
    const linkUrl = isRadio && ev.radio_station_website ? ev.radio_station_website : ev.url;
    const embed = isRadio ? ev.radio_embed ?? "" : "";
    const publisher = ev.publisher ?? (isRadio ? "FM broadcast" : null);
    refs.push({
      n: idx + 1,
      kind: isRadio ? "radio" : normaliseKind(ev.source_type),
      url: linkUrl,
      title: ev.title ?? null,
      publisher,
      label,
      captured_at: ev.captured_at ?? null,
      segment_at: undefined,
      thumbnail_url: ev.thumbnail_url ?? null,
      embed,
      reason: ev.quote ?? null,
      station_frequency_mhz: ev.station_frequency_mhz ?? null,
      uncited: false,
    });
  }
  return refs;
}

export interface RecommendationCardProps {
  option: RecommendationOption;
}

function CompactSourceRow({ sources }: { sources: SourceRef[] }) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const audiosRef = useRef<Map<string, HTMLAudioElement | null>>(new Map());

  function playSource(src: SourceRef) {
    const url = src.embed || src.url;
    if (!url || !url.endsWith(".m4a")) return;
    const key = `${src.kind}:${src.n}`;
    const el = audiosRef.current.get(key);
    if (!el) return;
    // Pause any other playing clips so only one plays at a time.
    for (const [k, other] of audiosRef.current.entries()) {
      if (other && k !== key && !other.paused) other.pause();
    }
    if (el.paused) {
      setActiveKey(key);
      void el.play().catch(() => {
        setActiveKey(null);
      });
    } else {
      el.pause();
      setActiveKey((current) => (current === key ? null : current));
    }
  }

  // Stop playback when this row unmounts.
  useEffect(() => {
    const audios = audiosRef.current;
    return () => {
      audios.forEach((el) => {
        if (el && !el.paused) el.pause();
      });
    };
  }, []);

  return (
    <ul className={styles.sourceList}>
      {sources.slice(0, 3).map((src) => {
        const host = hostFromUrl(src.url);
        const isRadio = src.kind === "radio";
        const isPlayable = isRadio && src.embed && src.embed.endsWith(".m4a");
        const key = `${src.kind}:${src.n}`;
        const active = activeKey === key;
        const titleText = src.title || src.label || "Source";
        return (
          <li key={key} className={styles.sourceListItem}>
            {isPlayable ? (
              <button
                type="button"
                className={styles.sourceListLink}
                onClick={() => playSource(src)}
                aria-pressed={active}
                aria-label={
                  active
                    ? `Pause ${titleText} radio clip`
                    : `Play ${titleText} radio clip`
                }
              >
                <SourceKindBadge kind={src.kind} />
                <span className={styles.sourceListLabel}>{titleText}</span>
                {host ? (
                  <span className={styles.sourceListHost}>{host}</span>
                ) : null}
                <span className={styles.sourceListPlay} aria-hidden="true">
                  {active ? (
                    <svg viewBox="0 0 12 12" width="10" height="10">
                      <rect x="3" y="2" width="2" height="8" fill="currentColor" />
                      <rect x="7" y="2" width="2" height="8" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 12 12" width="10" height="10">
                      <polygon points="3,2 10,6 3,10" fill="currentColor" />
                    </svg>
                  )}
                </span>
                <audio
                  ref={(el) => {
                    audiosRef.current.set(key, el);
                  }}
                  src={src.embed || ""}
                  preload="none"
                  onPause={() => {
                    if (activeKey === key) setActiveKey(null);
                  }}
                />
              </button>
            ) : (
              <a
                className={styles.sourceListLink}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SourceKindBadge kind={src.kind} />
                <span className={styles.sourceListLabel}>{titleText}</span>
                {host ? (
                  <span className={styles.sourceListHost}>{host}</span>
                ) : null}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function SourceKindBadge({ kind }: { kind: SourceKind }) {
  const palette: Record<string, { label: string; bg: string; fg: string }> = {
    radio: { label: "Radio", bg: "#F1F5F9", fg: "#0F172A" },
    tiktok: { label: "TikTok", bg: "#F1F5F9", fg: "#0F172A" },
    instagram: { label: "Instagram", bg: "#F1F5F9", fg: "#0F172A" },
    youtube: { label: "YouTube", bg: "#F1F5F9", fg: "#0F172A" },
    link: { label: "Web", bg: "#F1F5F9", fg: "#0F172A" },
    internal: { label: "Pulse", bg: "#F1F5F9", fg: "#0F172A" },
  };
  const entry = palette[kind] ?? palette.link;
  return (
    <span
      className={styles.sourceKindBadge}
      style={{ background: entry.bg, color: entry.fg }}
    >
      {entry.label}
    </span>
  );
}

export function RecommendationCard({ option }: RecommendationCardProps) {
  const windowStart = option.event_window?.start ?? option.availability;
  const windowEnd = option.event_window?.end;
  const sourceRefs = useMemo(
    () => recommendationEvidenceToSourceRefs(option),
    [option],
  );
  const featuredIds = option.featured_evidence_ids ?? [];
  const prioritisedSourceRefs = useMemo(() => {
    if (featuredIds.length === 0 || sourceRefs.length === 0) return sourceRefs;
    const order = new Map<number, number>();
    featuredIds.forEach((id, idx) => order.set(id, idx));
    return [...sourceRefs].sort((a, b) => {
      const aRank = order.has(a.n) ? order.get(a.n)! : Number.MAX_SAFE_INTEGER;
      const bRank = order.has(b.n) ? order.get(b.n)! : Number.MAX_SAFE_INTEGER;
      return aRank - bRank;
    });
  }, [featuredIds, sourceRefs]);
  return (
    <div className={styles.card} data-id={option.id}>
      <div className={styles.cardTitleRow}>
        <h3 className={styles.cardTitle}>{option.title}</h3>
        {option.category ? (
          <span className={styles.cardCategory}>
            {humaniseFacet(option.category)}
          </span>
        ) : null}
      </div>
      {option.why_it_fits ? (
        <p className={styles.cardWhy}>{option.why_it_fits}</p>
      ) : null}
      <div className={styles.cardMeta}>
        {windowStart ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>When:</span>
            {windowEnd ? (
              <>
                {formatWhen(windowStart)}
                {" → "}
                {formatWhen(windowEnd).replace(/^[A-Za-z]+ /, "")}
              </>
            ) : (
              formatWhen(windowStart)
            )}
          </span>
        ) : null}
        {option.location ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Where:</span>
            {option.location}
          </span>
        ) : null}
        {option.price ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Price:</span>
            {option.price}
          </span>
        ) : null}
        {option.indoor_outdoor ? (
          <span className={styles.metaItem}>
            <span className={styles.metaLabel}>Setting:</span>
            {option.indoor_outdoor}
          </span>
        ) : null}
      </div>
      {option.facets && option.facets.length > 0 ? (
        <div className={styles.facetRow}>
          {option.facets.map((facet) => (
            <span key={facet} className={styles.facetChip}>
              {humaniseFacet(facet)}
            </span>
          ))}
        </div>
      ) : null}
      {option.caveats && option.caveats.length > 0 ? (
        <ul className={styles.caveatList}>
          {option.caveats.map((caveat) => (
            <li key={caveat} className={styles.caveatItem}>
              <span aria-hidden="true" className={styles.caveatIcon}>
                <svg viewBox="0 0 12 12" width="12" height="12">
                  <path
                    d="M6 1 L11 11 L1 11 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="6"
                    y1="5"
                    x2="6"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                  <circle cx="6" cy="9.5" r="0.6" fill="currentColor" />
                </svg>
              </span>
              <span>{caveat}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {prioritisedSourceRefs.length > 0 ? (
        <CompactSourceRow sources={prioritisedSourceRefs} />
      ) : null}
    </div>
  );
}

export interface RecommendationListProps {
  options: RecommendationOption[];
  refinementPrompt?: string | null;
}

export default function RecommendationList({
  options,
  refinementPrompt,
}: RecommendationListProps) {
  const [expanded, setExpanded] = useState(false);
  if (!options || options.length === 0) return null;
  const visible = expanded ? options : options.slice(0, VISIBLE_REC_COUNT);
  const remaining = options.length - visible.length;
  return (
    <div className={styles.shortlist} aria-label="Recommended options">
      <div className={styles.header}>
        <span>Recommendations</span>
        <span className={styles.headerCount}>
          {options.length} {options.length === 1 ? "option" : "options"}
        </span>
      </div>
      {visible.map((option) => (
        <RecommendationCard key={option.id} option={option} />
      ))}
      {remaining > 0 ? (
        <button
          type="button"
          className={styles.moreButton}
          onClick={() => setExpanded(true)}
          aria-expanded={expanded}
        >
          Show {remaining} more {remaining === 1 ? "option" : "options"}
        </button>
      ) : null}
      {refinementPrompt ? (
        <div className={styles.refinementCard}>
          <span className={styles.refinementTitle}>Refine your picks</span>
          {refinementPrompt}
        </div>
      ) : null}
    </div>
  );
}
