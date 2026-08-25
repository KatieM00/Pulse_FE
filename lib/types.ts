export type Category =
  | "soca"
  | "beach"
  | "music"
  | "culture"
  | "market";
export type ConfidenceLabel = "high" | "medium" | "low" | "needs_review";
export type SourceType = "radio" | "newspaper" | "tiktok";

export interface EventSource {
  type: SourceType;
  name: string;
  timestamp: string;
  excerpt: string;
}

export interface Event {
  id: string;
  title: string;
  summary: string;
  location: string;
  date: string;
  category: Category;
  poster_url?: string;
  event_link?: string;
  tickets_required: boolean;
  ticket_note: string;
  sources: EventSource[];
  confidence: {
    label: ConfidenceLabel;
    reason: string;
  };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: Event[];
  sources?: SourceRef[];
  warnings?: string[];
}

/** A numbered, cited source returned by the Pulse ask API. */
export type SourceKind =
  | "radio"
  | "tiktok"
  | "instagram"
  | "youtube"
  | "link"
  | "internal";

/**
 * Base card geometry shared by Ask citations and the Home feed.
 *
 * Issue #26 introduced the visual + media contract; issue #30 reused
 * it for the live ``GET /api/feed`` response so both surfaces render
 * through the same component.
 */
export interface SourceCardBase {
  /** Radio: audio URL; tiktok: video id; instagram: shortcode; youtube: video id. */
  embed: string;
  /** ISO timestamp for the captured radio segment. */
  segment_at?: string;
  /** Human-readable title (station name, social post title, page title). */
  title?: string | null;
  /** Source identity (handle, site name, "FM broadcast"). */
  publisher?: string | null;
  /** ISO capture/observation timestamp for the underlying source. */
  captured_at?: string | null;
  /** Direct CDN preview image (signed URLs expire per answer). */
  thumbnail_url?: string | null;
  /** Radio only — broadcast frequency in MHz. */
  station_frequency_mhz?: number | null;
}

export interface SourceRef extends SourceCardBase {
  n: number;
  label: string;
  url: string;
  kind: SourceKind;
  /** Present in evidence but not cited inline — shown as "related". */
  uncited?: boolean;
  /** Single-sentence explanation of why this card was returned. */
  reason?: string | null;
}

/**
 * Home feed entry — same display contract as a Chat citation, plus the
 * server-typed source kind and excerpt text rendered above the card.
 */
export interface FeedItem extends SourceCardBase {
  source_type: string;
  label: string;
  /** Short, server-rendered excerpt (radio chunk, article body, or title fallback). */
  text: string;
  url: string;
  kind: SourceKind;
}

export interface FeedResponse {
  items: FeedItem[];
}

export interface AskResponse {
  answer: string;
  sources: SourceRef[];
  error?: string;
  /** Per-stage timings recorded by the orchestrator (planner, embedding, retrieval, composer, total). */
  timings_ms?: Record<string, number>;
  /** Pipeline trace (searches, lane counts, candidate counts, composer selection). */
  trace?: Record<string, unknown>;
  /** Pipeline version: always "ask" on the canonical path. */
  pipeline_version?: string;
  /** Warnings collected from the pipeline (e.g. empty retrieval). */
  warnings?: string[];
}
