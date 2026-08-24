export type Category = "soca" | "beach" | "music" | "culture" | "market";
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

export interface TravelSignal {
  id: string;
  headline: string;
  detail: string;
  source: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  events?: Event[];
  sources?: SourceRef[];
}

/** A numbered, cited source returned by the Pulse ask API. */
export type SourceKind = "radio" | "tiktok" | "instagram" | "youtube" | "link" | "internal";

export interface SourceRef {
  n: number;
  label: string;
  url: string;
  kind: SourceKind;
  /** radio: audio URL; tiktok: video id; instagram: shortcode; youtube: video id */
  embed: string;
  /** ISO timestamp for the captured radio segment. */
  segment_at?: string;
  /** Present in evidence but not cited inline — shown as "related". */
  uncited?: boolean;
  /** Issue #26 — display fields hydrated server-side. */
  /** Human-readable title (station name, social post title, page title). */
  title?: string | null;
  /** Source identity (handle, site name, "FM broadcast"). */
  publisher?: string | null;
  /** ISO capture/observation timestamp for the underlying source. */
  captured_at?: string | null;
  /** Direct CDN preview image (signed URLs expire per answer). */
  thumbnail_url?: string | null;
  /** Single-sentence explanation of why this card was returned. */
  reason?: string | null;
  /** Radio only — broadcast frequency in MHz. */
  station_frequency_mhz?: number | null;
}

export interface AskResponse {
  answer: string;
  sources: SourceRef[];
  error?: string;
}
