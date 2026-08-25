"use client";

import { useState } from "react";
import {
  RecommendationEvidence,
  RecommendationOption,
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

function EvidenceDot({ src }: { src: RecommendationEvidence }) {
  const palette: Record<string, string> = {
    radio: "#EF4444",
    newspaper: "#3B82F6",
    gis: "#10B981",
    tiktok: "#1A1A1A",
    instagram: "#EC4899",
    youtube_video: "#DC2626",
    events_calendar: "#8B5CF6",
  };
  return (
    <span
      aria-hidden="true"
      className={styles.evidenceDot}
      style={{ background: palette[src.source_type] ?? "#9CA3AF" }}
    />
  );
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

function formatSourceLabel(
  ev: RecommendationEvidence,
): { label: string; host: string | null } {
  const candidate =
    ev.title && ev.title.trim().length > 0
      ? ev.title.trim()
      : ev.publisher && ev.publisher.trim().length > 0
      ? ev.publisher.trim()
      : null;
  const base =
    candidate ?? ev.source_type.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const host = hostFromUrl(ev.url);
  return { label: base, host };
}

function renderSourceList(option: RecommendationOption) {
  const evidence = option.evidence ?? [];
  if (evidence.length === 0) return null;
  const featured = new Set(option.featured_evidence_ids ?? []);
  const filtered = evidence.filter(
    (ev) =>
      ev.url &&
      ev.url.length > 0 &&
      (featured.size === 0 || featured.has(ev.evidence_span_id ?? -1)),
  );
  const list = filtered.length > 0 ? filtered : evidence.filter((ev) => !!ev.url);
  if (list.length === 0) return null;
  return (
    <div className={styles.sourceList}>
      <span className={styles.sourceListLabel}>Sources</span>
      <ul className={styles.sourceListItems}>
        {list.slice(0, 4).map((ev) => {
          const { label, host } = formatSourceLabel(ev);
          return (
            <li key={`${ev.source_item_id}-${ev.evidence_span_id ?? 0}`}>
              <a
                className={styles.sourceLink}
                href={ev.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.sourceLinkLabel}>{label}</span>
                {host ? (
                  <span className={styles.sourceLinkHost}>{host}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DistinctSourceTypes(
  evidence: RecommendationEvidence[],
): { count: number; types: string[] } {
  const types = new Set<string>();
  for (const ev of evidence) types.add(ev.source_type);
  return { count: types.size, types: Array.from(types) };
}

export interface RecommendationCardProps {
  option: RecommendationOption;
}

export function RecommendationCard({ option }: RecommendationCardProps) {
  const distinct = DistinctSourceTypes(option.evidence);
  const windowStart = option.event_window?.start ?? option.availability;
  const windowEnd = option.event_window?.end;
  const status = option.verification === "verified" ? "verified" : "unverified";
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
      <div className={styles.evidenceRow}>
        <span
          className={
            status === "verified" ? styles.verifiedBadge : styles.unverifiedBadge
          }
        >
          {status === "verified" ? "Verified by sources" : "Limited evidence"}
        </span>
        {option.evidence.length > 0 ? (
          <span>
            <span className={styles.evidenceCount}>
              {option.evidence.length}
            </span>{" "}
            {option.evidence.length === 1 ? "source" : "sources"}
            {distinct.count > 1 ? (
              <> across {distinct.count} source types</>
            ) : null}
          </span>
        ) : null}
      </div>
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
      {renderSourceList(option)}
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
