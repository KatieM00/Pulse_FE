import { AskProgressEvent, AskResponse, FeedResponse } from "./types";
import {
  buildDemoResponse,
  DemoId,
  DemoResponse,
  getDemoScenario,
  listDemoIds,
  renderProgressEvents,
} from "./demoScenarios";

export type { AskProgressEvent } from "./types";

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

export interface StreamHandlers {
  onProgress: (event: AskProgressEvent) => void;
  signal?: AbortSignal;
}

export async function askPulseStream(
  question: string,
  history: Array<{ role: "user" | "assistant"; text: string }> = [],
  handlers: StreamHandlers,
): Promise<AskResponse> {
  // 120 s total — matches the JSON path. The server also enforces
  // its own per-request cap so we cannot hold the socket forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);
  if (handlers.signal) {
    handlers.signal.addEventListener("abort", () => controller.abort());
  }
  try {
    const resp = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question,
        captured_at: new Date().toISOString(),
        captured_window_hours: 0,
        conversation_history: history.slice(-8),
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      // The server always sends SSE for a 200; any non-200 means
      // the JSON branch answered (e.g. planner/composer unavailable
      // with HTTP 502). Surface the JSON error so the chat can fall
      // back to askPulse's existing error copy.
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
    if (!resp.body) {
      throw new Error("ask stream: empty response body");
    }
    return await consumeSseStream(resp.body, handlers);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Drain a Server-Sent Events body into typed ``AskProgressEvent``
 * records, calling ``handlers.onProgress`` for every event and
 * resolving with the final ``done`` payload's response.
 *
 * The parser is event-boundary-aware: bytes may straddle reads so we
 * accumulate a carry buffer between chunks and only split on the
 * SSE ``\\n\\n`` separator.
 */
export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: Pick<StreamHandlers, "onProgress">,
): Promise<AskResponse> {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let carry = "";
  let lastEvent: AskResponse | null = null;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    // Split on the SSE separator. Each frame is a sequence of
    // ``event: <type>`` / ``data: <payload>`` lines ending with a
    // blank line; padding lines (starting with ``:``) are skipped
    // by ``parseSseFrame``.
    let sep = carry.indexOf("\n\n");
    while (sep !== -1) {
      const frame = carry.slice(0, sep);
      carry = carry.slice(sep + 2);
      const parsed = parseSseFrame(frame);
      if (parsed) {
        handlers.onProgress(parsed);
        if (parsed.type === "done") {
          lastEvent = parsed.response;
        }
      }
      sep = carry.indexOf("\n\n");
    }
  }
  // Flush any trailing frame the server sent without a blank line.
  if (carry.trim()) {
    const parsed = parseSseFrame(carry);
    if (parsed) {
      handlers.onProgress(parsed);
      if (parsed.type === "done") {
        lastEvent = parsed.response;
      }
    }
  }
  if (!lastEvent) {
    throw new Error("ask stream: ended without a done event");
  }
  return stripUnopenable(lastEvent);
}

/**
 * Parse a single SSE frame (without the trailing blank line).
 * Returns ``null`` for padding-only / malformed frames so the
 * caller can safely stream over many of them.
 */
export function parseSseFrame(frame: string): AskProgressEvent | null {
  let eventType = "message";
  const dataLines: string[] = [];
  for (const rawLine of frame.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (line.startsWith(":")) continue;
    if (!line) continue;
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim() || "message";
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trimStart());
    }
  }
  if (!dataLines.length) return null;
  const payload = dataLines.join("\n");
  let decoded: Record<string, unknown>;
  try {
    decoded = JSON.parse(payload);
  } catch {
    // Skip malformed payloads rather than tearing down the stream.
    return null;
  }
  return shapeEvent(eventType, decoded);
}

function shapeEvent(
  eventType: string,
  decoded: Record<string, unknown>,
): AskProgressEvent | null {
  if (eventType === "started") {
    return {
      type: "started",
      version: strOr(decoded.version, "1"),
      step: numOr(decoded.step, 0),
      elapsed_ms: numOr(decoded.elapsed_ms, 0),
    };
  }
  if (eventType === "tool_started") {
    return {
      type: "tool_started",
      version: strOr(decoded.version, "1"),
      phase: "agent",
      status: "started",
      step: numOr(decoded.step, 0),
      tool_name: strOr(decoded.tool_name, ""),
      tool_label: strOr(decoded.tool_label, strOr(decoded.tool_name, "")),
      elapsed_ms: numOr(decoded.elapsed_ms, 0),
    };
  }
  if (eventType === "tool_finished") {
    const status = decoded.status === "failed" ? "failed" : "finished";
    return {
      type: "tool_finished",
      version: strOr(decoded.version, "1"),
      phase: "agent",
      status,
      step: numOr(decoded.step, 0),
      tool_name: strOr(decoded.tool_name, ""),
      tool_label: strOr(decoded.tool_label, strOr(decoded.tool_name, "")),
      ...(decoded.result_count !== undefined && {
        result_count: numOr(decoded.result_count, 0),
      }),
      ...(decoded.source_count !== undefined && {
        source_count: numOr(decoded.source_count, 0),
      }),
      elapsed_ms: numOr(decoded.elapsed_ms, 0),
      ...(decoded.error_message !== undefined && {
        error_message: String(decoded.error_message),
      }),
    };
  }
  if (eventType === "composer") {
    const status =
      decoded.status === "started" || decoded.status === "failed"
        ? decoded.status
        : "finished";
    return {
      type: "composer",
      version: strOr(decoded.version, "1"),
      phase: "composer",
      status,
      step: numOr(decoded.step, 0),
      ...(decoded.result_count !== undefined && {
        result_count: numOr(decoded.result_count, 0),
      }),
      elapsed_ms: numOr(decoded.elapsed_ms, 0),
      ...(decoded.error_message !== undefined && {
        error_message: String(decoded.error_message),
      }),
    };
  }
  if (eventType === "done") {
    const response = (decoded.response ?? {}) as AskResponse;
    return { type: "done", response };
  }
  if (eventType === "error") {
    return {
      type: "error",
      version: strOr(decoded.version, "1"),
      phase: "error",
      status: "failed",
      step: numOr(decoded.step, 0),
      error_message: strOr(decoded.error_message, "ask stream error"),
      ...(decoded.http_status !== undefined && {
        http_status: numOr(decoded.http_status, 500),
      }),
    };
  }
  return null;
}

function strOr(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function numOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
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

export interface DemoStreamHandlers {
  /** Called once per scripted progress event while the demo "runs". */
  onProgress: (event: AskProgressEvent) => void;
  /** Abort the in-flight scripted stream. */
  signal?: AbortSignal;
  /** Override the simulated per-step delay (ms). Defaults to 280. */
  stepDelayMs?: number;
}

/**
 * Replay a curated demo scenario as a stream of the same Ask progress
 * events the live pipeline emits, finishing with a `done` payload that
 * carries the deterministic response. The user prompt can be any of
 * the approved variants in the scenario (case- and whitespace-insensitive
 * match) or any natural-language question the chat can still frame
 * against the same scenario's evidence.
 *
 * Returns the canonical prompt that matched (or the scenario's primary
 * prompt when nothing matches) so the caller can echo it back to the
 * chat history as the user-facing question.
 */
export async function askDemoStream(
  demoId: string | null | undefined,
  userPrompt: string,
  handlers: DemoStreamHandlers,
): Promise<{ response: AskResponse; resolvedPrompt: string; demoId: DemoId | null }> {
  const scenario = getDemoScenario(demoId);
  if (!scenario) {
    throw new Error(`unknown demo: ${demoId}`);
  }

  const resolvedPrompt = userPrompt?.trim() || scenario.primary_prompt;
  const response = buildDemoResponse(scenario, resolvedPrompt);
  const events = renderProgressEvents(scenario, response.sources.length);

  const controller = new AbortController();
  if (handlers.signal) {
    handlers.signal.addEventListener("abort", () => controller.abort());
  }
  const stepDelayMs = handlers.stepDelayMs ?? 280;

  for (const event of events) {
    if (controller.signal.aborted) break;
    if (event.type === "done") {
      // Replace the empty placeholder response with the real one.
      handlers.onProgress({
        type: "done",
        response: {
          answer: response.answer,
          sources: response.sources,
          pipeline_version: response.pipeline_version,
          warnings: [],
        },
      });
      const final: AskResponse = {
        answer: response.answer,
        sources: response.sources,
        pipeline_version: response.pipeline_version,
        warnings: [],
      };
      return { response: final, resolvedPrompt, demoId: scenario.id };
    }
    handlers.onProgress(event);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, stepDelayMs);
      controller.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("aborted"));
      });
    });
  }
  throw new Error("demo stream ended without done event");
}

export function listAvailableDemos(): DemoId[] {
  return listDemoIds();
}

export { getDemoScenario };

export type { DemoId, DemoResponse };

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