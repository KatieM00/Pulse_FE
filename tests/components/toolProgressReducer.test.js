"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");

/**
 * Pure-formatter unit tests for the rows ToolProgress renders. The
 * component itself is a tiny reduction over the SSE event stream,
 * so testing the formatter in isolation keeps the test setup
 * dependency-free (no React renderer).
 */

function reduce(events) {
  const toolRows = [];
  let composerStarted = false;
  let composerFinished = false;
  let composerFailed = false;
  let composerResultCount;
  for (const event of events) {
    if (event.type === "tool_started") {
      toolRows.push({
        toolName: event.tool_name,
        label: event.tool_label,
        finished: false,
        failed: false,
        elapsedMs: 0,
        resultCount: undefined,
      });
    } else if (event.type === "tool_finished") {
      let row =
        toolRows.find((r) => r.toolName === event.tool_name && !r.finished) ||
        toolRows[toolRows.length - 1];
      if (!row) continue;
      row.finished = true;
      row.failed = event.status === "failed";
      row.elapsedMs = event.elapsed_ms;
      row.resultCount = event.result_count;
    } else if (event.type === "composer") {
      if (event.status === "started") composerStarted = true;
      if (event.status === "finished") {
        composerFinished = true;
        composerResultCount = event.result_count;
      }
      if (event.status === "failed") composerFailed = true;
    }
  }
  return { toolRows, composerStarted, composerFinished, composerFailed, composerResultCount };
}

test("tool rows collapse started + finished into one entry", () => {
  const events = [
    { type: "tool_started", tool_name: "search_text", tool_label: "Search text", step: 0 },
    { type: "tool_finished", tool_name: "search_text", tool_label: "Search text", status: "finished", result_count: 7, elapsed_ms: 412, step: 0 },
  ];
  const { toolRows } = reduce(events);
  assert.equal(toolRows.length, 1);
  assert.equal(toolRows[0].toolName, "search_text");
  assert.equal(toolRows[0].finished, true);
  assert.equal(toolRows[0].resultCount, 7);
});

test("multiple tool rows stay in arrival order", () => {
  const events = [
    { type: "tool_started", tool_name: "resolve_entities", tool_label: "Resolve entities", step: 0 },
    { type: "tool_finished", tool_name: "resolve_entities", tool_label: "Resolve entities", status: "finished", elapsed_ms: 200, step: 0 },
    { type: "tool_started", tool_name: "search_text", tool_label: "Search text", step: 1 },
    { type: "tool_finished", tool_name: "search_text", tool_label: "Search text", status: "finished", result_count: 3, elapsed_ms: 600, step: 1 },
  ];
  const { toolRows } = reduce(events);
  assert.deepEqual(
    toolRows.map((r) => r.toolName),
    ["resolve_entities", "search_text"],
  );
});

test("failed tools keep their status", () => {
  const events = [
    { type: "tool_started", tool_name: "search_text", tool_label: "Search text", step: 0 },
    { type: "tool_finished", tool_name: "search_text", tool_label: "Search text", status: "failed", elapsed_ms: 50, step: 0, error_message: "db down" },
  ];
  const { toolRows } = reduce(events);
  assert.equal(toolRows[0].failed, true);
  assert.equal(toolRows[0].finished, true);
});

test("composer finished carries result count", () => {
  const events = [
    { type: "composer", status: "started", elapsed_ms: 0 },
    { type: "composer", status: "finished", result_count: 5, elapsed_ms: 1000 },
  ];
  const { composerStarted, composerFinished, composerResultCount } = reduce(events);
  assert.equal(composerStarted, true);
  assert.equal(composerFinished, true);
  assert.equal(composerResultCount, 5);
});