"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { execSync } = require("node:child_process");

/**
 * Mirrors the small section in ``tests/lib/demoScenarios.test.js``:
 * compile the TS module to a tmp dir with the local tsc and require
 * it as CommonJS so Node's runner can exercise the parser/mapper
 * without bringing in a JSX renderer.
 */

function buildModule() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");
  const outDir = "/tmp/grouped-feed-build";
  execSync(
    `${tscBin} lib/groupedFeed.ts --target ES2017 --module commonjs --moduleResolution node --esModuleInterop --skipLibCheck --outDir ${outDir}`,
    { cwd: repoRoot, encoding: "utf8", shell: "/bin/sh" },
  );
  return require(`${outDir}/groupedFeed`);
}

const mod = buildModule();

function makeItem(url, sourceType = "newspaper") {
  return {
    source_type: sourceType,
    label: "Test",
    text: "excerpt",
    url,
    kind: "link",
    embed: "",
  };
}

function makeTheme(id, items, accent = "green") {
  return {
    id,
    icon: "✨",
    accent,
    headline: `Headline ${id}`,
    subtitle: `Subtitle ${id}`,
    items,
    view_all: `/theme/${id}`,
  };
}

test("normaliseGroupedFeed returns themes with items", () => {
  const body = {
    themes: [
      makeTheme("sports", [makeItem("https://x/1")]),
      makeTheme("commerce", [makeItem("https://x/2")]),
    ],
    as_of: "2026-09-03T17:30:00+00:00",
    window_hours: 24,
  };
  const themes = mod.normaliseGroupedFeed(body, { maxThemes: 4 });
  assert.equal(themes.length, 2);
  assert.equal(themes[0].id, "sports");
  assert.equal(themes[1].id, "commerce");
});

test("normaliseGroupedFeed drops themes with empty items", () => {
  const body = {
    themes: [
      makeTheme("sports", []),
      makeTheme("commerce", [makeItem("https://x/2")]),
    ],
  };
  const themes = mod.normaliseGroupedFeed(body);
  assert.equal(themes.length, 1);
  assert.equal(themes[0].id, "commerce");
});

test("normaliseGroupedFeed caps items per theme", () => {
  const items = [
    makeItem("https://x/1"),
    makeItem("https://x/2"),
    makeItem("https://x/3"),
    makeItem("https://x/4"),
    makeItem("https://x/5"),
  ];
  const body = { themes: [makeTheme("sports", items)] };
  const themes = mod.normaliseGroupedFeed(body, { itemsPerTheme: 3 });
  assert.equal(themes[0].items.length, 3);
});

test("normaliseGroupedFeed caps total themes at maxThemes", () => {
  const themes = Array.from({ length: 7 }, (_, i) =>
    makeTheme(`t${i}`, [makeItem(`https://x/${i}`)]),
  );
  const body = { themes };
  const out = mod.normaliseGroupedFeed(body, { maxThemes: 4 });
  assert.equal(out.length, 4);
});

test("normaliseGroupedFeed returns empty for legacy flat shape", () => {
  const body = { items: [makeItem("https://x/1")] };
  assert.deepEqual(mod.normaliseGroupedFeed(body), []);
});

test("normaliseGroupedFeed coerces unknown accent to grey", () => {
  const body = {
    themes: [makeTheme("sports", [makeItem("https://x/1")], "neon")],
  };
  const themes = mod.normaliseGroupedFeed(body);
  assert.equal(themes[0].accent, "grey");
});

test("normaliseGroupedFeed keeps known accent tokens", () => {
  const body = {
    themes: [
      makeTheme("sports", [makeItem("https://x/1")], "green"),
      makeTheme("commerce", [makeItem("https://x/2")], "orange"),
      makeTheme("events", [makeItem("https://x/3")], "purple"),
      makeTheme("weather", [makeItem("https://x/4")], "blue"),
      makeTheme("civic", [makeItem("https://x/5")], "amber"),
      makeTheme("community", [makeItem("https://x/6")], "grey"),
      makeTheme("context", [makeItem("https://x/7")], "teal"),
    ],
  };
  const themes = mod.normaliseGroupedFeed(body, { maxThemes: 7 });
  const accents = themes.map((t) => t.accent);
  assert.deepEqual(accents, [
    "green",
    "orange",
    "purple",
    "blue",
    "amber",
    "grey",
    "teal",
  ]);
});

test("normaliseGroupedFeed falls back to /theme/<id> when view_all is missing", () => {
  const body = {
    themes: [
      {
        id: "sports",
        icon: "🏏",
        accent: "green",
        headline: "H",
        subtitle: "S",
        items: [makeItem("https://x/1")],
      },
    ],
  };
  const themes = mod.normaliseGroupedFeed(body);
  assert.equal(themes[0].view_all, "/theme/sports");
});

test("normaliseGroupedFeed supplies fallback headline and icon when missing", () => {
  const body = {
    themes: [
      {
        id: "sports",
        accent: "green",
        items: [makeItem("https://x/1")],
      },
    ],
  };
  const themes = mod.normaliseGroupedFeed(body);
  assert.equal(themes[0].icon, "✨");
  assert.equal(themes[0].headline, "Latest signals");
  assert.equal(themes[0].subtitle, "");
});

test("isGroupedFeed distinguishes grouped vs flat responses", () => {
  assert.equal(
    mod.isGroupedFeed({ themes: [makeTheme("sports", [makeItem("https://x/1")])] }),
    true,
  );
  assert.equal(mod.isGroupedFeed({ items: [] }), false);
  assert.equal(mod.isGroupedFeed(null), false);
  assert.equal(mod.isGroupedFeed(undefined), false);
});
