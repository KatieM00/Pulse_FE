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
}
