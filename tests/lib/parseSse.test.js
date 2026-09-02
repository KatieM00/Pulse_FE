"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { parseSseFrame, consumeSseStream } = require("./parseSse");

function frame(payload, event = "message") {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

test("parses a single tool_finished event", () => {
  const parsed = parseSseFrame(
    frame(
      {
        version: "1",
        phase: "agent",
        status: "finished",
        step: 0,
        tool_name: "search_text",
        tool_label: "Search text",
        result_count: 7,
        elapsed_ms: 412,
      },
      "tool_finished",
    ),
  );
  assert.ok(parsed);
  assert.equal(parsed.type, "tool_finished");
  assert.equal(parsed.tool_name, "search_text");
  assert.equal(parsed.tool_label, "Search text");
  assert.equal(parsed.result_count, 7);
  assert.equal(parsed.elapsed_ms, 412);
});

test("parses done with nested response", () => {
  const parsed = parseSseFrame(
    frame({ response: { answer: "ok", sources: [] } }, "done"),
  );
  assert.ok(parsed);
  assert.equal(parsed.type, "done");
  assert.equal(parsed.response.answer, "ok");
  assert.deepEqual(parsed.response.sources, []);
});

test("parses composer phase events", () => {
  const parsed = parseSseFrame(
    frame(
      {
        version: "1",
        phase: "composer",
        status: "started",
        step: 0,
        elapsed_ms: 0,
      },
      "composer",
    ),
  );
  assert.ok(parsed);
  assert.equal(parsed.type, "composer");
  assert.equal(parsed.status, "started");
});

test("parses error event with http_status", () => {
  const parsed = parseSseFrame(
    frame(
      {
        version: "1",
        phase: "error",
        status: "failed",
        step: 0,
        error_message: "composer unavailable",
        http_status: 502,
      },
      "error",
    ),
  );
  assert.ok(parsed);
  assert.equal(parsed.type, "error");
  assert.equal(parsed.http_status, 502);
  assert.equal(parsed.error_message, "composer unavailable");
});

test("returns null for padding-only frames", () => {
  assert.equal(parseSseFrame(": padding\n: padding\n"), null);
});

test("returns null for malformed JSON data lines", () => {
  const bad = "event: tool_finished\ndata: {not json\n\n";
  assert.equal(parseSseFrame(bad), null);
});

test("falls back to derived label when tool_label missing", () => {
  const parsed = parseSseFrame(
    frame(
      {
        version: "1",
        phase: "agent",
        status: "started",
        step: 0,
        tool_name: "search_text",
        elapsed_ms: 0,
      },
      "tool_started",
    ),
  );
  assert.ok(parsed);
  assert.equal(parsed.type, "tool_started");
  assert.equal(parsed.tool_label, "search_text");
});

test("handles missing data lines", () => {
  assert.equal(parseSseFrame("event: started\n\n"), null);
});

test("consumeSseStream handles events split across reads", async () => {
  const full = frame({ phase: "agent", status: "started", step: 0, tool_name: "search_text", tool_label: "Search text", elapsed_ms: 0 }, "tool_started")
    + frame({ phase: "agent", status: "finished", step: 0, tool_name: "search_text", tool_label: "Search text", elapsed_ms: 412, result_count: 7 }, "tool_finished")
    + frame({ phase: "composer", status: "started", step: 0, elapsed_ms: 0 }, "composer")
    + frame({ phase: "composer", status: "finished", step: 0, elapsed_ms: 900, result_count: 1 }, "composer")
    + frame({ response: { answer: "ok", sources: [] } }, "done");

  // Feed bytes through three arbitrary chunk boundaries.
  const chunks = [full.slice(0, 50), full.slice(50, 200), full.slice(200)];
  const encoded = chunks.map((c) => new TextEncoder().encode(c));

  let cursor = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (cursor >= encoded.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoded[cursor]);
      cursor++;
    },
  });

  const events = [];
  const last = await consumeSseStream(stream, (e) => events.push(e));
  assert.equal(events.length, 5);
  assert.equal(events[0].type, "tool_started");
  assert.equal(events[1].type, "tool_finished");
  assert.equal(events[1].result_count, 7);
  assert.equal(events[4].type, "done");
  assert.equal(last.answer, "ok");
});

test("consumeSseStream skips malformed payloads", async () => {
  const full = "event: tool_started\ndata: {not json\n\n"
    + frame({ phase: "agent", status: "started", step: 0, tool_name: "search_text", tool_label: "Search text", elapsed_ms: 0 }, "tool_started")
    + frame({ response: { answer: "ok", sources: [] } }, "done");
  const encoded = [new TextEncoder().encode(full)];
  const stream = new ReadableStream({
    start(controller) {
      encoded.forEach((c) => controller.enqueue(c));
      controller.close();
    },
  });
  const events = [];
  const last = await consumeSseStream(stream, (e) => events.push(e));
  assert.equal(events.length, 2);
  assert.equal(events[0].type, "tool_started");
  assert.equal(last.answer, "ok");
});

test("consumeSseStream flushes trailing frame without blank line", async () => {
  const full = frame({ response: { answer: "ok", sources: [] } }, "done");
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(full));
      controller.close();
    },
  });
  const events = [];
  const last = await consumeSseStream(stream, (e) => events.push(e));
  assert.equal(events.length, 1);
  assert.equal(last.answer, "ok");
});