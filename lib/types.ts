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
  /** V3 (issue #31): ranked shortlist returned by the backend */
  options?: RecommendationOption[];
  /** V3: explicit list of missing details the user can supply to refine */
  refinement_prompt?: string | null;
  /** V3: assumptions the brief made because details were absent */
  assumptions?: string[];
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

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * One supporting source attached to an Ask V3 recommendation (issue #31).
 *
 * ``source_type`` is intentionally free-form: V3 mixes newspaper, radio,
 * Instagram, TikTok, GIS, events-calendar and corpus chunks under a single
 * canonical recommendation so the consumer renders them through the same
 * shared ``SourceCard`` component used by the Home feed and Chat citations.
 */
export interface RecommendationEvidence {
  source_item_id: number;
  source_chunk_id: number;
  evidence_span_id: number | null;
  claim_id: number | null;
  source_type: string;
  captured_at: string | null;
  quote: string;
  url: string | null;
  title: string | null;
  publisher: string | null;
  confidence: number | null;
  /** Radio source: the public station site the card should open. */
  radio_station_website?: string | null;
  /** Radio source: broadcast frequency in MHz. */
  station_frequency_mhz?: number | null;
  /** Radio source: embedded audio URL for the in-card play button. */
  radio_embed?: string | null;
}

/**
 * The V3 (issue #31) typed-concierge API returns a ranked shortlist of
 * ``RecommendationOption`` rows. The backend owns the selection; the
 * composer can explain but must not invent IDs.
 */
export interface RecommendationOption {
  /** Stable canonical id (kind + title + event-time + locations). */
  id: string;
  kind: string;
  title: string;
  category: string | null;
  /** Composer-generated explanation of why it fits the user's question. */
  why_it_fits: string;
  /** ISO timestamp / range string for availability when supported. */
  availability: string | null;
  location: string | null;
  price: string | null;
  /** Whether the recommendation is fully verified by source evidence. */
  verification: "verified" | "unverified";
  caveats: string[];
  evidence: RecommendationEvidence[];
  /** Span IDs the composer explicitly chose to feature as sources. */
  featured_evidence_ids?: number[];
  facets: string[];
  indoor_outdoor: string | null;
  family_friendly: boolean | null;
  event_window: { start: string; end?: string } | null;
}

export interface AskResponse {
  answer: string;
  sources: SourceRef[];
  error?: string;
  /** V3 (issue #31): ranked shortlist when the backend is V3. */
  options?: RecommendationOption[];
  /** V3: refine prompt (e.g. "tell me your starting location") */
  refinement_prompt?: string | null;
  /** V3: list of assumptions the brief made from the question. */
  assumptions?: string[];
  /** V3: per-stage timings recorded by the orchestrator. */
  timings_ms?: Record<string, number>;
  /** V3: structured pipeline trace for debugging. */
  trace?: Record<string, unknown>;
  /** V3: "v2" / "v3" / "legacy" — surfaces which pipeline produced the response. */
  pipeline_version?: string;
  /** V3: "recommendation" / "factual" / "lookup" */
  mode?: string;
  /** V3: warnings collected from the pipeline (e.g. composer unavailable). */
  warnings?: string[];
}
