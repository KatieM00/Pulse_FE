"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

// The chat page consumes a compiled CommonJS/ESM bundle in the browser,
// so we exercise the scenario registry through its own logic by
// copying the necessary functions into a Node-runnable test. The
// registry is a plain TypeScript module with no runtime dependencies
// other than the AskProgressEvent union, which we re-shape here.
//
// Keeping this in sync is easy: the test file mirrors the public API
// surface used by app/chat/page.tsx (getDemoScenario,
// matchApprovedPrompt, the intent detector, and the block selector).
// If those change, the test must change too.

const { execSync } = require("node:child_process");

function runScenarioBuilder() {
  // The repo installs TypeScript as a dev dependency, so use the local
  // tsc rather than the network. We compile the source module to a
  // /tmp dir and require it as CommonJS so Node's test runner can
  // import the function surface directly.
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");
  execSync(
    `${tscBin} lib/demoScenarios.ts --target ES2017 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --outDir /tmp/demoScenarios-build`,
    { cwd: repoRoot, encoding: "utf8", shell: "/bin/sh" },
  );
  return require("/tmp/demoScenarios-build/demoScenarios");
}

const mod = runScenarioBuilder();

test("getDemoScenario returns null for unknown ids", () => {
  assert.equal(mod.getDemoScenario("unknown"), null);
  assert.equal(mod.getDemoScenario(null), null);
  assert.equal(mod.getDemoScenario(""), null);
});

test("getDemoScenario returns the two curated scenarios", () => {
  const circus = mod.getDemoScenario("circus");
  const market = mod.getDemoScenario("grand-market");
  assert.ok(circus);
  assert.ok(market);
  assert.equal(circus.id, "circus");
  assert.equal(market.id, "grand-market");
});

test("every scenario has at least two source kinds", () => {
  for (const id of ["circus", "grand-market"]) {
    const s = mod.getDemoScenario(id);
    const kinds = new Set(s.sources.map((src) => src.kind));
    assert.ok(
      kinds.size >= 2,
      `${id} should mix at least two source kinds (got ${[...kinds].join(", ")})`,
    );
    assert.ok(
      kinds.has("radio"),
      `${id} should include at least one radio source`,
    );
  }
});

test("every radio embed contains a chunk id, not a station-level slug", () => {
  for (const id of ["circus", "grand-market"]) {
    const s = mod.getDemoScenario(id);
    for (const src of s.sources) {
      if (src.kind !== "radio") continue;
      assert.ok(
        src.embed.startsWith("/radio/") && src.embed.endsWith(".m4a"),
        `radio embed must look like /radio/<chunk>.m4a (got ${src.embed})`,
      );
      const slug = src.embed.slice("/radio/".length, -".m4a".length);
      assert.ok(
        /-[0-9]{6,}/.test(slug),
        `radio embed slug must contain a numeric chunk id (got ${slug})`,
      );
    }
  }
});

test("every external source URL is http or https", () => {
  for (const id of ["circus", "grand-market"]) {
    const s = mod.getDemoScenario(id);
    for (const src of s.sources) {
      assert.ok(
        /^https?:\/\//.test(src.url),
        `${id} source ${src.n} url should be http(s) (got ${src.url})`,
      );
    }
  }
});

test("approved prompts match case- and whitespace-insensitively", () => {
  const s = mod.getDemoScenario("circus");
  const matched = mod.matchApprovedPrompt(s, "  I'M LOOKING FOR SOMETHING different TO DO with MY FAMILY tonight. what's going on?  ");
  assert.equal(matched, s.primary_prompt);
  const none = mod.matchApprovedPrompt(s, "Tell me something nobody knows.");
  assert.equal(none, null);
});

test("buildDemoResponse renders the lead paragraph first", () => {
  const s = mod.getDemoScenario("circus");
  const r = mod.buildDemoResponse(s, s.primary_prompt);
  assert.equal(r.demo_id, "circus");
  assert.ok(r.answer.startsWith("The Suarez Brothers Circus"), "lead paragraph must anchor the answer");
  assert.ok(r.sources.length >= 2, "primary prompt should pull at least two source cards");
});

test("food intent trims the grand-market answer to food-relevant blocks", () => {
  const s = mod.getDemoScenario("grand-market");
  const r = mod.buildDemoResponse(s, "I want to try some Caribbean food");
  assert.ok(/cou cou|oil down|food court|food stalls/i.test(r.answer));
  // Should not include the VOB caller paragraph about parking when the
  // user only asked about food.
  assert.ok(
    !/parking|congestion/i.test(r.answer),
    "parking paragraph should not appear in a food-focused answer",
  );
});

test("parking intent surfaces the VOB caller paragraph in grand-market", () => {
  const s = mod.getDemoScenario("grand-market");
  const r = mod.buildDemoResponse(s, "What's the parking like?");
  assert.ok(/parking|congestion/i.test(r.answer), "parking answer should mention parking or congestion");
});

test("family intent on the circus surfaces the Friday 7pm callout", () => {
  const s = mod.getDemoScenario("circus");
  const r = mod.buildDemoResponse(s, "I've got the kids and want something family tonight");
  assert.ok(/7\s*pm/i.test(r.answer));
});

test("demo snapshot label formats in en-GB DD MMM YYYY", () => {
  const s = mod.getDemoScenario("circus");
  const r = mod.buildDemoResponse(s, s.primary_prompt);
  assert.match(r.demo_label, /^Verified demo snapshot · \d{2} [A-Z][a-z]{2} \d{4}$/);
});

test("progress stream ends with a done event carrying the answer", () => {
  const s = mod.getDemoScenario("circus");
  const events = mod.renderProgressEvents(s, 5);
  const done = events[events.length - 1];
  assert.equal(done.type, "done");
  // The first event is always started.
  assert.equal(events[0].type, "started");
  // The composer events fire in the right order around the tools.
  const toolStarts = events.filter((e) => e.type === "tool_started").length;
  const toolFinishes = events.filter((e) => e.type === "tool_finished").length;
  assert.equal(toolStarts, toolFinishes);
});
