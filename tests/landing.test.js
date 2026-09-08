const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const html = readFileSync(join(__dirname, "../public/welcome.html"), "utf8");

test("homepage uses worked examples instead of unsupported question suggestions", () => {
  assert.doesNotMatch(html, /questions-panel|What can you ask\?|weather|traffic/i);
});

test("both homepage search forms submit labelled questions to the app", () => {
  const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map(
    (match) => match[0],
  );
  assert.equal(forms.length, 2);
  for (const form of forms) {
    assert.match(form, /action="https:\/\/app\.pulsebarbados\.com\/chat"/);
    assert.match(form, /method="get"/);
    assert.match(form, /name="q"/);
    assert.match(form, /required/);
    const id = form.match(/<input[^>]*id="([^"]+)"/)[1];
    assert.ok(form.includes(`for="${id}"`));
  }
});

test("homepage preserves demo and architecture destinations with dated previews", () => {
  for (const demo of ["circus", "grand-market", "cricket"]) {
    assert.ok(
      html.includes(`https://app.pulsebarbados.com/chat?demo=${demo}&amp;q=`),
    );
  }
  assert.match(html, /id="demos"/);
  assert.match(html, /href="\/build.html"/);
  assert.match(html, /Historical example/);
  assert.match(html, /6 September 2026/);
  assert.match(html, /28 August 2026/);
  assert.doesNotMatch(html, /live now|LIVE ON AIR/i);
});

test("homepage has its own styles and native source disclosure", () => {
  assert.match(html, /href="\/pulse-home.css"/);
  assert.doesNotMatch(html, /href="\/pulse-landing.css"/);
  assert.match(html, /<details[\s\S]*?<summary>/);
  assert.match(html, /<main id="main"/);
});

test("all three worked examples include their own readable screenshot and explanation", () => {
  const examples = [
    ...html.matchAll(
      /<article\b[^>]*class="worked-example"[\s\S]*?<\/article>/g,
    ),
  ].map((match) => match[0]);
  assert.equal(examples.length, 3);
  for (const [index, demo] of ["circus", "grand-market", "cricket"].entries()) {
    const example = examples[index];
    assert.ok(example.includes(`?demo=${demo}&amp;q=`));
    assert.match(example, /<h3\b/);
    assert.match(example, /<blockquote>/);
    assert.match(example, /What this shows/);
    assert.match(example, /<img[\s\S]*?loading="lazy"/);
    assert.match(example, /<figcaption>/);
  }
  assert.doesNotMatch(html, /class="case-image"|class="more-demos"/);
});
