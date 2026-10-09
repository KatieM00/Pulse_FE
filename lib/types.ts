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
  /** Streamed progress events for this assistant turn. Populated by
   *  the SSE consumer; the final ``done`` event marks the assistant
   *  message as finalised. */
  progress?: AskProgressEvent[];
  /** True after the ``done`` event has been seen — text / sources
   *  / warnings are no longer placeholders. */
  finalised?: boolean;
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
  captured_at_basis?: "captured" | "published" | "registered" | "unknown" | null;
  /** Direct CDN preview image (signed URLs expire per answer). */
  thumbnail_url?: string | null;
  /** Radio only — broadcast frequency in MHz. */
  station_frequency_mhz?: number | null;
  /** Segment offset within a radio recording, not the ingest timestamp. */
  start_offset_s?: number | null;
  end_offset_s?: number | null;
  /** Physical media registered on Pulse (rather than a remote embed id). */
  asset_kind?: "image" | "video" | "audio" | null;
  asset_index?: number | null;
  /** Dates deliberately retain their separate meanings. */
  known_at?: string | null;
  /** Exact applicability wording copied from the supporting quote, not a normalized date. */
  temporal_text?: string | null;
  published_at?: string | null;
  published_at_source?: string | null;
  modified_at?: string | null;
  source_registered_at?: string | null;
  revision_id?: number | null;
  revision_ordinal?: number | null;
  snapshot_id?: number | null;
  snapshot_index?: number | null;
  snapshot_is_current?: boolean | null;
  observation_kind?: string | null;
  media_observation?: string | null;
  /** Entity-specific structured fields (dates, revision, snapshot, OCR, etc.). */
  data?: Record<string, unknown> | null;
  /** Publisher's own permalink, kept even when `url` opens a retained excerpt. */
  publisher_url?: string | null;
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

/**
 * One themed home-feed section returned by the default ``/api/feed``
 * shape. The grouped variant threads claim themes (sports, events,
 * weather, ...) into the home page so each section carries a
 * topical headline and a small set of source cards.
 *
 * Theme accent is a colour-name token the renderer maps to a CSS
 * palette; ``icon`` is a single emoji rendered inside a tinted chip.
 * ``view_all`` is the static frontend route (e.g. ``/theme/sports``)
 * that filters the grouped feed by theme id.
 */
export type ThemeAccent =
  | "green"
  | "orange"
  | "purple"
  | "blue"
  | "amber"
  | "teal"
  | "grey";

export interface FeedTheme {
  id: string;
  icon: string;
  accent: ThemeAccent;
  headline: string;
  subtitle: string;
  items: FeedItem[];
  view_all: string;
  /** Optional debug surface for trace views. Not rendered in production UI. */
  claim_count?: number;
}

/**
 * Discriminated union: the default ``/api/feed`` returns the themed
 * shape; ``?flat=true`` returns the legacy flat shape. Consumers
 * narrow on the presence of one of the two top-level keys.
 */
export type FeedResponse =
  | {
      themes: FeedTheme[];
      as_of?: string;
      window_hours?: number;
    }
  | { items: FeedItem[] };

/** Narrow a :data:`FeedResponse` to the themed variant. */
export function isGroupedFeedResponse(
  body: FeedResponse,
): body is Extract<FeedResponse, { themes: FeedTheme[] }> {
  return Array.isArray((body as { themes?: unknown }).themes);
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
  /** Pulse2 additive: answered/partial/needs_clarification/insufficient_evidence/unavailable. */
  outcome?: { outcome?: string; answered?: boolean; reasons?: string[] } | null;
  /** Pulse2 additive: "model" when an LLM wrote the prose, "composed" otherwise. */
  answer_source?: string | null;
}

/**
 * Server-Sent Events stream consumed by the chat when the request
 * opts in via ``Accept: text/event-stream``. The wire shape mirrors
 * ``pulse.ask_progress.ProgressEvent`` on the backend.
 */
export type AskProgressEvent =
  | {
      type: "started";
      version: string;
      step: number;
      elapsed_ms: number;
    }
  | {
      type: "tool_started";
      version: string;
      phase: "agent";
      status: "started";
      step: number;
      tool_name: string;
      tool_label: string;
      elapsed_ms: number;
    }
  | {
      type: "tool_finished";
      version: string;
      phase: "agent";
      status: "finished" | "failed";
      step: number;
      tool_name: string;
      tool_label: string;
      result_count?: number;
      source_count?: number;
      elapsed_ms: number;
      error_message?: string;
    }
  | {
      type: "composer";
      version: string;
      phase: "composer";
      status: "started" | "finished" | "failed";
      step: number;
      result_count?: number;
      elapsed_ms: number;
      error_message?: string;
    }
  | {
      type: "done";
      response: AskResponse;
    }
  | {
      type: "error";
      version: string;
      phase: "error";
      status: "failed";
      step: number;
      error_message: string;
      http_status?: number;
    };
