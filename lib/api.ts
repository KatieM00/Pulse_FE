import { AskResponse, FeedResponse } from "./types";

// In production the static export is served by Caddy, which proxies
// same-origin /api/* to the Python API service on pulse-new. In dev,
// point NEXT_PUBLIC_API_BASE at a locally running `python -m pulse.api`.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

// Issue #31 typed-concierge discovery. The Pulse backend now returns a
// ranked shortlist of ``options`` whenever the V3 pipeline is in use.
// The frontend asks for V3 explicitly so legacy/V2 callers don't see a
// behaviour change until the operator opts in.
export const ASK_PIPELINE_VERSION =
  process.env.NEXT_PUBLIC_ASK_PIPELINE ?? "v3";

export async function askPulse(
  question: string,
  history: Array<{ role: "user" | "assistant"; text: string }> = [],
): Promise<AskResponse> {
  const controller = new AbortController();
  // Specialist retrievers now run in parallel (issue #31). The worst-case
  // p95 target is 15s; leave headroom for the composer call.
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    // Anchor the retrieval to "now" with a 48-hour recency window so a
    // chat question asked at 23:00 still surfaces radio transcripts that
    // arrived at 16:00 the same day. The V3 live_signal_retriever uses
    // captured_window_hours to bound the chunk scan; the structured
    // event and activity retrievers ignore it so evergreen attractions
    // are not dropped.
    //
    // ``conversation_history`` carries the last user/assistant turns in
    // this chat so the composer can do follow-up reasoning against the
    // graph. We cap at 8 entries on the server.
    const resp = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        captured_at: new Date().toISOString(),
        captured_window_hours: 48,
        pipeline: ASK_PIPELINE_VERSION,
        conversation_history: history.slice(-8),
      }),
      signal: controller.signal,
    });
    const body = (await resp.json()) as AskResponse;
    if (!resp.ok) {
      throw new Error(body.error ?? `ask failed (${resp.status})`);
    }
    return stripUnopenable(body);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Drop any source whose URL isn't http(s) or whose kind is "internal".
 * The backend's V2 path may still surface travel_corpus entries with
 * ``file:///...`` URLs from a local dev environment; those are not
 * openable in production.
 */
function stripUnopenable(body: AskResponse): AskResponse {
  if (Array.isArray(body?.sources)) {
    body.sources = body.sources.filter((src) => {
      if (!src) return false;
      if (src.kind === "internal") return false;
      if (!src.url || !/^https?:\/\//i.test(src.url)) return false;
      return true;
    });
  }
  return body;
}

export async function fetchFeed(limit = 8): Promise<FeedResponse> {
  const controller = new AbortController();
  // Feed reads are local SQL + bounded preview enrichment; cap tightly
  // so a stalled /api/* proxy does not freeze the home page.
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const resp = await fetch(
      `${API_BASE}/api/feed?limit=${Math.max(1, Math.min(limit, 50))}`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!resp.ok) {
      throw new Error(`feed failed (${resp.status})`);
    }
    return (await resp.json()) as FeedResponse;
  } finally {
    clearTimeout(timeout);
  }
}
