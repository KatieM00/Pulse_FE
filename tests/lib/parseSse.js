"use strict";

/**
 * JS-friendly copy of ``lib/api.ts::parseSseFrame``. Kept in sync
 * via tests that exercise the SSE wire format directly. The TS
 * implementation remains the source of truth — this file exists so
 * the Node 20 test runner can validate the parser without a TS
 * toolchain.
 */

function strOr(value, fallback) {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function numOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function shapeEvent(eventType, decoded) {
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
    const response = decoded.response || {};
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

function parseSseFrame(frame) {
  let eventType = "message";
  const dataLines = [];
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
  let decoded;
  try {
    decoded = JSON.parse(payload);
  } catch {
    return null;
  }
  return shapeEvent(eventType, decoded);
}

/**
 * Consume a ReadableStream of bytes and yield every parsed
 * ``AskProgressEvent`` to ``onProgress``. The last ``done`` payload
 * is returned to the caller so tests can verify the final shape.
 */
async function consumeSseStream(body, onProgress) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let carry = "";
  let lastDone = null;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    carry += decoder.decode(value, { stream: true });
    let sep = carry.indexOf("\n\n");
    while (sep !== -1) {
      const frame = carry.slice(0, sep);
      carry = carry.slice(sep + 2);
      const parsed = parseSseFrame(frame);
      if (parsed) {
        onProgress(parsed);
        if (parsed.type === "done") lastDone = parsed.response;
      }
      sep = carry.indexOf("\n\n");
    }
  }
  if (carry.trim()) {
    const parsed = parseSseFrame(carry);
    if (parsed) {
      onProgress(parsed);
      if (parsed.type === "done") lastDone = parsed.response;
    }
  }
  return lastDone;
}

module.exports = { parseSseFrame, consumeSseStream };