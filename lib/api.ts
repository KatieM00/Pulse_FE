import { AskResponse } from "./types";

// In production the static export is served by Caddy, which proxies
// same-origin /api/* to the Python API service on pulse-new. In dev,
// point NEXT_PUBLIC_API_BASE at a locally running `python -m pulse.api`.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function askPulse(question: string): Promise<AskResponse> {
  const controller = new AbortController();
  // KG expansion + answer model can take tens of seconds.
  const timeout = setTimeout(() => controller.abort(), 120_000);
  try {
    // Anchor the retrieval to "now" with a 48-hour recency window so a
    // chat question asked at 23:00 still surfaces radio transcripts that
    // arrived at 16:00 the same day. The v2 pipeline's default 365-day
    // fallback otherwise lets older events-calendar cards outrank fresh
    // radio coverage for broad "what's happening" prompts.
    const resp = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        captured_at: new Date().toISOString(),
        captured_window_hours: 48,
      }),
      signal: controller.signal,
    });
    const body = (await resp.json()) as AskResponse;
    if (!resp.ok) {
      throw new Error(body.error ?? `ask failed (${resp.status})`);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
}
