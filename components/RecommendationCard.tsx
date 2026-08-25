"use client";

import { useMemo, useState } from "react";
import {
  RecommendationEvidence,
  RecommendationOption,
  SourceKind,
  SourceRef,
} from "@/lib/types";
import styles from "./RecommendationCard.module.css";
import SourceList from "./SourceList";

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
        <SourceList sources={prioritisedSourceRefs} />
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
