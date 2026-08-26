import { AskResponse, FeedResponse } from "./types";

// In production the static export is served by Caddy, which proxies
// same-origin /api/* to the Python API service on pulse-new. In dev,
// point NEXT_PUBLIC_API_BASE at a locally running `python -m pulse.api`.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function askPulse(
  question: string,
  history: Array<{ role: "user" | "assistant"; text: string }> = [],
): Promise<AskResponse> {
  const controller = new AbortController();
  // The canonical Ask pipeline runs a planner LLM, a batched embedder
  // call, the seven hybrid retrieval lanes, and a composer LLM. The
  // worst-case p95 target is 25s; leave headroom for the composer call.
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    // No recency window: the server treats captured_window_hours=0 as
    // "no SQL cutoff", so the chat surfaces the full corpus (older radio
    // broadcasts, weeks-old social posts) the operator can browse. The
    // per-search freshness_days from the planner LLM still applies on
    // top, so "what's happening now" questions still lean recent.
    //
    // ``conversation_history`` carries the last user/assistant turns in
    // this chat so the planner and composer can interpret follow-up
    // questions against the prior context. We cap at 8 entries on the
    // server.
    const resp = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        captured_at: new Date().toISOString(),
        captured_window_hours: 0,
        conversation_history: history.slice(-8),
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const body = (await resp.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
      };
      const detail = body.detail ? `: ${body.detail}` : "";
      throw new Error(
        body.error
          ? `${body.error}${detail}`
          : `ask failed (${resp.status})`,
      );
    }
    const body = (await resp.json()) as AskResponse;
    return stripUnopenable(body);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Drop any source whose URL isn't http(s) or whose kind is "internal".
 * The retrieval pack may still surface travel_corpus entries with
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
