/**
 * Curated "demo snapshot" fixtures.
 *
 * Two verified scenarios anchor the concierge demo:
 *
 *   /chat?demo=circus
 *   /chat?demo=grand-market
 *
 * Each scenario pins a snapshot date (Friday 28 August 2026 Barbados time)
 * and provides several approved prompt variations that all resolve to the
 * same evidence-backed response. The router in `app/chat/page.tsx`
 * resolves the active demo, picks the prompt that matches what the user
 * actually typed (if any of the approved variants match, case- and
 * whitespace-insensitively), and otherwise uses the primary prompt.
 *
 * Why this lives outside the live Ask pipeline: the pipeline is
 * inherently probabilistic, and we need the demo to behave identically
 * on every run. Fixture data is real evidence from the corpus — verified
 * radio, TikTok, Instagram, and events-calendar rows — but the framing
 * and source-card order are deterministic so the presenter can rehearse.
 */

import type { AskProgressEvent, SourceRef } from "./types";

export type DemoId = "circus" | "grand-market";

export interface DemoSource {
  /** Stable cite number, starting at 1. */
  n: number;
  /** Display label (station, account, or site name). */
  label: string;
  /** Public URL opened by the card link. */
  url: string;
  /** Source kind for the SourceCard badge. */
  kind: SourceRef["kind"];
  /** Radio embed path with an exact chunk id (never station-level). */
  embed: string;
  captured_at: string;
  /** Radio frequency in MHz, when applicable. */
  station_frequency_mhz?: number;
  /** Card title (station name, handle, page title). */
  title: string;
  /** Card publisher (host or "FM broadcast"). */
  publisher: string;
  /** Optional per-card relevance sentence. */
  reason: string;
  /** Thumbnail URL — only set for hosts we know don't expire quickly. */
  thumbnail_url?: string | null;
}

export interface DemoProgressStep {
  tool_name: string;
  tool_label: string;
  /** Duration in ms — kept short so the demo runs inside 6 s total. */
  elapsed_ms: number;
  /** Number of hits the step "returned". */
  result_count: number;
  /** Why this step matters, shown in the composer card. */
  summary: string;
}

/**
 * Answer-building blocks. Each block is a self-contained paragraph (or
 * short list) backed by one or more sources in the same scenario. The
 * router selects which blocks to render based on the user's prompt and
 * joins them with two spaces for natural reading.
 */
export type DemoBlock =
  | { kind: "p"; text: string; source_n: number }
  | { kind: "p_multi"; text: string; sources_ns: number[] }
  | { kind: "soft_unknown"; missing: string };

export interface DemoScenario {
  id: DemoId;
  /** Title shown in the demo snapshot banner. */
  title: string;
  /** Subtitle shown under the title. */
  subtitle: string;
  /** Snapshot date as ISO-8601 (28 August 2026 12:00 AST ≈ 16:00 UTC). */
  snapshot_at: string;
  /** Conversation history seed shown when the demo loads. */
  prompts: string[];
  /** Default prompt used when the user types nothing recognised. */
  primary_prompt: string;
  /** Shared answer assembled from selected blocks. */
  blocks: DemoBlock[];
  /** Source cards displayed in order. */
  sources: DemoSource[];
  /** Scripted progress events shown while the "search" runs. */
  progress: DemoProgressStep[];
}

const SNAPSHOT_ISO = "2026-08-28T16:00:00Z";

/* ------------------------------------------------------------------ */
/* Circus — Suarez Brothers Circus at Garrison Savannah.              */
/* ------------------------------------------------------------------ */

const circusScenario: DemoScenario = {
  id: "circus",
  title: "Suarez Brothers Circus",
  subtitle: "Garrison Savannah · Friday 28 August 2026 snapshot",
  snapshot_at: SNAPSHOT_ISO,
  prompts: [
    "I'm looking for something different to do with my family tonight. What's going on?",
    "We've done the beach already. Is there anything memorable happening tonight?",
    "I've got the kids with me and we'd like some evening entertainment. What would you recommend?",
    "I'm looking for a family activity that feels a bit special. Is anything on this evening?",
    "My guests want something entertaining tonight that isn't dinner or the beach. What can I suggest?",
    "Where is it, and can I still get tickets?",
    "Are people actually recommending it?",
  ],
  primary_prompt:
    "I'm looking for something different to do with my family tonight. What's going on?",
  blocks: [
    {
      kind: "p_multi",
      text:
        "The Suarez Brothers Circus is back in Barbados under the big top at **Garrison Savannah** — the biggest circus from Mexico, currently running ten days of family shows. For tonight (Friday 28 August) the **7 pm** performance is the main one to plan around.",
      sources_ns: [1, 2],
    },
    {
      kind: "p",
      text:
        "Q 100.7 FM and The Beat 104.1 FM have been running daily ticket-giveaway promos and cast interviews all week — the family framing and confirmed showtimes on those promos are your safest reference.",
      source_n: 1,
    },
    {
      kind: "p_multi",
      text:
        "Recent visitor TikToks (this week, after the original listing had ended) show people still attending at the new location, which is why I'm trusting the radio and social evidence over the older **7–23 August at Belle Junction** event listing. The official calendar hasn't been refreshed yet.",
      sources_ns: [4, 5],
    },
    {
      kind: "p",
      text:
        "Tickets and seat selection are easiest on the show's own site — the radio promos repeat the address every break, and the cast interview on The Beat confirmed same-day tickets at the gate when available.",
      source_n: 2,
    },
    {
      kind: "soft_unknown",
      missing:
        "I don't have a verified dress code or final weekend date — the listed window ended 23 August and the team's own site is the most reliable for tonight's showtime and last performance day.",
    },
  ],
  sources: [
    {
      n: 1,
      label: "q-1007",
      url: "https://www.cbc.bb",
      kind: "radio",
      embed: "/radio/q-1007-chunk-1787603682032.m4a",
      captured_at: "2026-08-24T20:34:42+00:00",
      station_frequency_mhz: 100.7,
      title: "Q 100.7 FM",
      publisher: "FM broadcast",
      reason:
        "Confirms Suarez Brothers is the biggest circus from Mexico at Garrison Savannah with Mon–Fri 7 pm, Sat 5 & 8 pm, Sun 2, 5 & 8 pm.",
    },
    {
      n: 2,
      label: "the-beat-1041",
      url: "https://starcomnetwork.net",
      kind: "radio",
      embed: "/radio/the-beat-1041-chunk-1787664200447.m4a",
      captured_at: "2026-08-25T13:23:20+00:00",
      station_frequency_mhz: 104.1,
      title: "The Beat 104.1 FM",
      publisher: "FM broadcast",
      reason:
        "In-studio interview with the cast confirms the show schedule and that tickets are available online and at the box office.",
    },
    {
      n: 3,
      label: "the-one-981",
      url: "https://www.cbc.bb",
      kind: "radio",
      embed: "/radio/the-one-981-chunk-1787617712630.m4a",
      captured_at: "2026-08-25T00:28:32+00:00",
      station_frequency_mhz: 98.1,
      title: "98.1 The One",
      publisher: "FM broadcast",
      reason:
        "On-air ticket giveaway ties the Suarez Brothers showtime to a phone call-in, confirming the Friday 7 pm slot.",
    },
    {
      n: 4,
      label: "@lynzographyy",
      url: "https://www.tiktok.com/@lynzographyy/video/7678480561727409429",
      kind: "tiktok",
      embed: "7678480561727409429",
      captured_at: "2026-08-26T23:06:19+00:00",
      title: "Something Different To Do In Barbados",
      publisher: "lynzographyy",
      reason:
        "Visitor TikTok from 26 August describing finally experiencing the circus — newer than the original 7–23 August listing.",
    },
    {
      n: 5,
      label: "@djcow246",
      url: "https://www.tiktok.com/@djcow246/video/7678340863541693714",
      kind: "tiktok",
      embed: "7678340863541693714",
      captured_at: "2026-08-26T14:04:11+00:00",
      title: "A night at the circus",
      publisher: "djcow246",
      reason:
        "Second visitor TikTok from the same week, independently confirming the circus is operating at the new location.",
    },
    {
      n: 6,
      label: "Barbados Events Calendar",
      url: "https://events.barbados.org/event/suarez-brothers-circus/",
      kind: "link",
      embed: "",
      captured_at: "2026-08-17T01:12:38+00:00",
      title: "Suarez Brothers Circus · Barbados Events Calendar",
      publisher: "events.barbados.org",
      reason:
        "Official listing still shows the older 7–23 August window at Belle Junction — kept visible because the radio and social evidence supersede it, not because it's the most current.",
    },
  ],
  progress: [
    {
      tool_name: "resolve_entities",
      tool_label: "Resolve entities",
      elapsed_ms: 110,
      result_count: 4,
      summary: "Located Suarez Brothers Circus and Garrison Savannah in the graph.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search event listings",
      elapsed_ms: 220,
      result_count: 1,
      summary: "Found the official 7–23 August listing at Belle Junction (older).",
    },
    {
      tool_name: "search_text",
      tool_label: "Search local radio",
      elapsed_ms: 380,
      result_count: 5,
      summary: "Q 100.7, The Beat and 98.1 all carry the new Garrison Savannah showtimes.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search Instagram",
      elapsed_ms: 260,
      result_count: 2,
      summary: "Skipped — TikToks are the more recent first-hand coverage.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search TikTok",
      elapsed_ms: 310,
      result_count: 2,
      summary: "Visitor posts from 26 August confirm the circus is still running at the new location.",
    },
    {
      tool_name: "search_claims",
      tool_label: "Reconcile recent updates",
      elapsed_ms: 150,
      result_count: 1,
      summary: "Latest radio + TikTok supersede the older event-calendar window.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Grand Market — Caribbean Grand Market at CARIFESTA House.           */
/* ------------------------------------------------------------------ */

const grandMarketScenario: DemoScenario = {
  id: "grand-market",
  title: "Caribbean Grand Market",
  subtitle: "CARIFESTA House, Waterford · Friday 28 August 2026 snapshot",
  snapshot_at: SNAPSHOT_ISO,
  prompts: [
    "I'm looking for something cultural to do. What's going on this week?",
    "I'd like to try some Caribbean food and buy something locally made. Where should I go?",
    "I'm looking for somewhere with food, shopping and local culture today. What's on?",
    "I want to experience something genuinely Caribbean this week. What would you recommend?",
    "Is there anywhere I can meet local makers, try regional food and hear some music?",
    "My guests want a cultural afternoon rather than another beach day. Where should I send them?",
    "Is it suitable for children, and how late is it open?",
    "Where is it, and how do we get there?",
    "Is admission free?",
    "What's the parking like?",
  ],
  primary_prompt:
    "I'm looking for something cultural to do. What's going on this week?",
  blocks: [
    {
      kind: "p_multi",
      text:
        "The **Caribbean Grand Market** is running at **CARIFESTA House, Waterford, St. Michael** for ten vibrant days. For your snapshot, today (Friday 28 August) and the weekend still fall inside the official **21–30 August** window.",
      sources_ns: [1, 6],
    },
    {
      kind: "p_multi",
      text:
        "It's a genuinely cultural day out — regional makers from Grenada, Jamaica, Guyana, Suriname, Trinidad and Tobago and Barbados, fashion and jewellery, art and craft, wellness products, plus a food court with regional favourites like pepper pot, cou cou, oil down and grilled fish. Free admission, and **open 10 am–10 pm** every day.",
      sources_ns: [1, 4],
    },
    {
      kind: "p",
      text:
        "VOB 92.9 FM ran a live caller discussion midweek — a couple of regulars had already gone and recommended it, while others flagged parking and traffic congestion around Waterford / the Stadium redevelopment roadworks. If you're driving, allow extra time.",
      source_n: 2,
    },
    {
      kind: "p_multi",
      text:
        "Children's activities are mentioned across both the radio promos and the NCF Instagram posts, with evening entertainment scheduled nightly — a good fit if you're bringing family or friends along for the afternoon.",
      sources_ns: [1, 4],
    },
    {
      kind: "p",
      text:
        "One housekeeping note for concierges: the official NCF material says the market ends **30 August**, while one visitor TikTok mentions a **31 August** wind-down. I'd recommend presenting the weekend (29–30 August) as the safer window until the official programme is refreshed.",
      source_n: 5,
    },
    {
      kind: "soft_unknown",
      missing:
        "I don't have a verified breakdown of which specific vendors are appearing on which day — the NCF Instagram posts the running entertainment schedule, so that's the live source.",
    },
  ],
  sources: [
    {
      n: 1,
      label: "the-one-981",
      url: "https://www.cbc.bb",
      kind: "radio",
      embed: "/radio/the-one-981-chunk-1787949808262.m4a",
      captured_at: "2026-08-28T20:43:28+00:00",
      station_frequency_mhz: 98.1,
      title: "98.1 The One",
      publisher: "FM broadcast",
      reason:
        "Lists the food stalls, take-home products and confirmed dates at CARIFESTA House, Waterford.",
    },
    {
      n: 2,
      label: "vob-929",
      url: "https://starcomnetwork.net",
      kind: "radio",
      embed: "/radio/vob-929-chunk-1787851333985.m4a",
      captured_at: "2026-08-27T17:22:13+00:00",
      station_frequency_mhz: 92.9,
      title: "VOB – Voice of Barbados",
      publisher: "FM broadcast",
      reason:
        "Live caller discussion covering who's already been and the parking/traffic situation around Waterford.",
    },
    {
      n: 3,
      label: "the-beat-1041",
      url: "https://starcomnetwork.net",
      kind: "radio",
      embed: "/radio/the-beat-1041-chunk-1787951787418.m4a",
      captured_at: "2026-08-28T21:16:27+00:00",
      station_frequency_mhz: 104.1,
      title: "The Beat 104.1 FM",
      publisher: "FM broadcast",
      reason:
        "Mentions regional cuisine, children's activities, daily entertainment and the 10 am–10 pm hours.",
    },
    {
      n: 4,
      label: "@thencfbarbados",
      url: "https://www.instagram.com/p/DcQmvuoHwmq/",
      kind: "instagram",
      embed: "DcQmvuoHwmq",
      captured_at: "2026-08-20T11:00:18+00:00",
      title: "National Cultural Foundation on Instagram",
      publisher: "Instagram",
      reason:
        "Official organiser post confirming the 21–30 August window, free admission and live entertainment each evening.",
    },
    {
      n: 5,
      label: "@asuitcaseandaticket",
      url: "https://www.tiktok.com/@asuitcaseandaticket/video/7678027304848674068",
      kind: "tiktok",
      embed: "7678027304848674068",
      captured_at: "2026-08-25T17:47:29+00:00",
      title: "Caribbean Grand Market kicked off on August 22nd",
      publisher: "asuitcaseandaticket",
      reason:
        "Visitor TikTok describing the range of Caribbean artisans and a 22–31 August window — source of the date conflict.",
    },
    {
      n: 6,
      label: "@thisisladymac",
      url: "https://www.instagram.com/p/DchsCcWjTDH/",
      kind: "instagram",
      embed: "DchsCcWjTDH",
      captured_at: "2026-08-27T02:13:29+00:00",
      title: "A few snaps from the Grand Market at Carifesta House",
      publisher: "Instagram",
      reason:
        "On-site attendee Instagram photos showing the venue as it actually looks on the day.",
    },
    {
      n: 7,
      label: "Barbados Events Calendar",
      url: "https://events.barbados.org/event/caribbean-grand-market/",
      kind: "link",
      embed: "",
      captured_at: "2026-08-17T01:12:38+00:00",
      title: "Caribbean Grand Market · Barbados Events Calendar",
      publisher: "events.barbados.org",
      reason:
        "Official listing for the 21–30 August window at CARIFESTA House, with organiser and venue details.",
    },
  ],
  progress: [
    {
      tool_name: "resolve_entities",
      tool_label: "Resolve entities",
      elapsed_ms: 140,
      result_count: 4,
      summary: "Located Caribbean Grand Market and CARIFESTA House in the graph.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search event listings",
      elapsed_ms: 220,
      result_count: 1,
      summary: "Official listing confirms 21–30 August at CARIFESTA House.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search local radio",
      elapsed_ms: 410,
      result_count: 6,
      summary: "VOB, 98.1 and The Beat all confirm hours, cuisine and parking concerns.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search Instagram",
      elapsed_ms: 240,
      result_count: 4,
      summary: "NCF organiser posts plus attendee photos from 26–27 August.",
    },
    {
      tool_name: "search_text",
      tool_label: "Search TikTok",
      elapsed_ms: 290,
      result_count: 1,
      summary: "Visitor TikTok from 25 August — and a date conflict to flag.",
    },
    {
      tool_name: "search_claims",
      tool_label: "Reconcile recent updates",
      elapsed_ms: 170,
      result_count: 2,
      summary: "Conflicting end dates reconciled: official 30 vs visitor 31.",
    },
  ],
};

const SCENARIOS: Record<DemoId, DemoScenario> = {
  circus: circusScenario,
  "grand-market": grandMarketScenario,
};

/* ------------------------------------------------------------------ */
/* Public lookup + framing.                                           */
/* ------------------------------------------------------------------ */

export function listDemoIds(): DemoId[] {
  return ["circus", "grand-market"];
}

export function getDemoScenario(id: string | null | undefined): DemoScenario | null {
  if (!id) return null;
  if (id === "circus" || id === "grand-market") return SCENARIOS[id];
  return null;
}

/**
 * Recognised intents, matched against the user's typed prompt. Each
 * scenario maps each intent to the subset of its blocks that best
 * answers that question.
 */
export type DemoIntent =
  | "family"
  | "food"
  | "culture"
  | "shopping"
  | "today"
  | "venue"
  | "logistics"
  | "admission"
  | "social_proof"
  | "general";

const INTENT_PATTERNS: Array<{ intent: DemoIntent; patterns: RegExp[] }> = [
  {
    intent: "family",
    patterns: [
      /\bfamily\b/i,
      /\bkids?\b/i,
      /\bchildren\b/i,
      /\bmem(or)?able\b/i,
      /\bspecial\b/i,
      /\bentertainment\b/i,
      /\bevening\b/i,
    ],
  },
  {
    intent: "food",
    patterns: [/\bfood\b/i, /\beat(ing)?\b/i, /\bdrink\b/i, /\brum\b/i, /\bcuisine\b/i],
  },
  {
    intent: "culture",
    patterns: [/\bcultur/i, /\bcaribbean\b/i, /\bregional\b/i, /\blocal(ly)?\b/i],
  },
  {
    intent: "shopping",
    patterns: [
      /\bshop\b/i,
      /\bgift/i,
      /\bmaker/i,
      /\bvendor/i,
      /\bcraft\b/i,
      /\bjeweller?y\b/i,
      /\bfashion\b/i,
    ],
  },
  {
    intent: "today",
    patterns: [/\btoday\b/i, /\btonight\b/i, /\bthis week\b/i, /\bthis weekend\b/i],
  },
  {
    intent: "venue",
    patterns: [/\bwhere\b/i, /\blocation\b/i, /\bdirection/i, /\bvenue\b/i, /\baddress\b/i],
  },
  {
    intent: "admission",
    patterns: [/\bfree\b/i, /\bprice\b/i, /\bticket/i, /\bcost\b/i, /\bpay\b/i],
  },
  {
    intent: "logistics",
    patterns: [/\bpark(ing)?\b/i, /\btraffic\b/i, /\bgetting there\b/i, /\bdriv(e|ing)\b/i],
  },
  {
    intent: "social_proof",
    patterns: [/\brecommend/i, /\bpeople\b/i, /\bworth\b/i, /\bbusy\b/i, /\bgood\b/i],
  },
];

export function detectPrompts(text: string): DemoIntent[] {
  const intents = new Set<DemoIntent>();
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(text))) intents.add(intent);
  }
  if (intents.size === 0) intents.add("general");
  return Array.from(intents);
}

interface BlockFilterResult {
  blocks: DemoBlock[];
  sources_ns: Set<number>;
}

/**
 * Select and order blocks for a given intent set. Sources referenced by
 * any rendered block are collected so the card list can be filtered
 * accordingly.
 */
export function selectBlocks(scenario: DemoScenario, intents: DemoIntent[]): BlockFilterResult {
  const wanted = new Set<DemoIntent>(intents);
  const allIntent = wanted.has("general");

  // Soft unknown (gap) blocks are always included last so the answer
  // never overpromises, but only if the user's prompt asked something
  // specific that the demo snapshot cannot verify.
  const keepSoftUnknown = !allIntent && wanted.size > 0;

  const include: DemoBlock[] = [];
  const sources_ns = new Set<number>();

  // Lead with the lead paragraph (always index 0). It anchors every
  // answer to the same evidence set.
  const lead = scenario.blocks[0];
  if (lead) {
    include.push(lead);
    for (const n of getBlockSources(lead)) sources_ns.add(n);
  }

  for (const block of scenario.blocks.slice(1)) {
    if (block.kind === "soft_unknown") {
      if (keepSoftUnknown) {
        include.push(block);
      }
      continue;
    }
    if (allIntent) {
      include.push(block);
      for (const n of getBlockSources(block)) sources_ns.add(n);
      continue;
    }
    // Targeted intents map onto specific block indices per scenario.
    if (shouldKeepBlock(scenario.id, block, wanted)) {
      include.push(block);
      for (const n of getBlockSources(block)) sources_ns.add(n);
    }
  }

  // Cap to keep cards tidy: at most one soft-unknown block, at most
  // five total paragraphs.
  const trimmed: DemoBlock[] = [];
  let softKept = false;
  for (const block of include) {
    if (block.kind === "soft_unknown") {
      if (softKept) continue;
      softKept = true;
    }
    trimmed.push(block);
    if (trimmed.length >= 6) break;
  }
  return { blocks: trimmed, sources_ns };
}

function getBlockSources(block: DemoBlock): number[] {
  if (block.kind === "p") return [block.source_n];
  if (block.kind === "p_multi") return block.sources_ns;
  return [];
}

/**
 * Per-scenario routing of intents to block indices. The lead paragraph
 * (index 0) is always included; this controls the supporting blocks
 * that answer the user's specific intent.
 */
function shouldKeepBlock(
  scenarioId: DemoId,
  block: DemoBlock,
  wanted: Set<DemoIntent>,
): boolean {
  if (block.kind === "soft_unknown") return false;
  const idx = indexOfBlock(scenarioId, block);
  if (idx < 0) return false;

  // Both scenarios share the lead and then a small set of supporting
  // blocks. Index 1 is the headline framing for each scenario.
  if (scenarioId === "circus") {
    if (idx === 1) {
      // The radio-showtimes paragraph belongs with family/venue/admission.
      return (
        wanted.has("family") ||
        wanted.has("venue") ||
        wanted.has("admission") ||
        wanted.has("today")
      );
    }
    if (idx === 2) {
      // The "newer evidence supersedes older listing" paragraph belongs
      // with general/social-proof/venue (people questioning the rec).
      return (
        wanted.has("social_proof") ||
        wanted.has("venue") ||
        wanted.has("general") ||
        wanted.has("family")
      );
    }
    if (idx === 3) {
      // Ticket guidance paragraph.
      return (
        wanted.has("admission") ||
        wanted.has("family") ||
        wanted.has("general") ||
        wanted.has("today")
      );
    }
  }

  if (scenarioId === "grand-market") {
    if (idx === 1) {
      // Headline food + shopping paragraph.
      return (
        wanted.has("food") ||
        wanted.has("shopping") ||
        wanted.has("culture") ||
        wanted.has("general")
      );
    }
    if (idx === 2) {
      // Parking / VOB caller discussion.
      return wanted.has("logistics") || wanted.has("venue");
    }
    if (idx === 3) {
      // Family-friendly / evening entertainment paragraph.
      return wanted.has("family") || wanted.has("today");
    }
    if (idx === 4) {
      // Date conflict + softer recommendation.
      return (
        wanted.has("today") ||
        wanted.has("venue") ||
        wanted.has("general") ||
        wanted.has("social_proof")
      );
    }
  }

  return false;
}

function indexOfBlock(scenarioId: DemoId, block: DemoBlock): number {
  const scenario = SCENARIOS[scenarioId];
  return scenario.blocks.indexOf(block);
}

/* ------------------------------------------------------------------ */
/* Assemble the response the chat page will consume.                   */
/* ------------------------------------------------------------------ */

export interface DemoResponse {
  /** Assistant answer prose. */
  answer: string;
  /** Source cards in cite order. */
  sources: SourceRef[];
  /** Pipeline trace stub for parity with live Ask responses. */
  pipeline_version: "demo";
  /** Suggested progress events the chat page can play while streaming. */
  progress: AskProgressEvent[];
  /** Demo snapshot label, e.g. "Verified demo snapshot · 28 Aug 2026". */
  demo_label: string;
  /** Active demo id so the chat can pin the conversation header. */
  demo_id: DemoId;
}

export function buildDemoResponse(
  scenario: DemoScenario,
  userPrompt: string,
): DemoResponse {
  const intents = detectPrompts(userPrompt);
  const { blocks, sources_ns } = selectBlocks(scenario, intents);

  const paragraphs = blocks.map((block) => {
    if (block.kind === "soft_unknown") {
      return block.missing;
    }
    return block.text;
  });
  const answer = paragraphs.join("\n\n");

  const sources = scenario.sources
    .filter((src) => sources_ns.has(src.n))
    .map(toSourceRef);

  const progress = renderProgressEvents(scenario, sources.length);

  return {
    answer,
    sources,
    pipeline_version: "demo",
    progress,
    demo_label: formatDemoLabel(scenario),
    demo_id: scenario.id,
  };
}

function toSourceRef(src: DemoSource): SourceRef {
  return {
    n: src.n,
    label: src.label,
    url: src.url,
    kind: src.kind,
    embed: src.embed,
    title: src.title,
    publisher: src.publisher,
    captured_at: src.captured_at,
    ...(src.station_frequency_mhz !== undefined && {
      station_frequency_mhz: src.station_frequency_mhz,
    }),
    ...(src.thumbnail_url !== undefined && { thumbnail_url: src.thumbnail_url }),
    reason: src.reason,
  };
}

function formatDemoLabel(scenario: DemoScenario): string {
  // Stable formatting: e.g. "Verified demo snapshot · 28 Aug 2026".
  const date = new Date(scenario.snapshot_at);
  const human = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Barbados",
  });
  return `Verified demo snapshot · ${human}`;
}

/**
 * Convert a scenario's scripted progress steps into the same event
 * shape the chat page already consumes for live SSE streams.
 */
export function renderProgressEvents(
  scenario: DemoScenario,
  sourceCount: number,
): AskProgressEvent[] {
  const events: AskProgressEvent[] = [];
  events.push({ type: "started", version: "1", step: 0, elapsed_ms: 0 });

  let step = 0;
  for (const p of scenario.progress) {
    events.push({
      type: "tool_started",
      version: "1",
      phase: "agent",
      status: "started",
      step,
      tool_name: p.tool_name,
      tool_label: p.tool_label,
      elapsed_ms: 0,
    });
    events.push({
      type: "tool_finished",
      version: "1",
      phase: "agent",
      status: "finished",
      step,
      tool_name: p.tool_name,
      tool_label: p.tool_label,
      result_count: p.result_count,
      elapsed_ms: p.elapsed_ms,
    });
    step += 1;
  }

  events.push({
    type: "composer",
    version: "1",
    phase: "composer",
    status: "started",
    step,
    elapsed_ms: 0,
  });
  events.push({
    type: "composer",
    version: "1",
    phase: "composer",
    status: "finished",
    step,
    result_count: sourceCount,
    elapsed_ms: 320,
  });

  events.push({
    type: "done",
    response: {
      answer: "",
      sources: [],
      pipeline_version: "demo",
    },
  });
  return events;
}

/**
 * Exact-match (case- and whitespace-insensitive) of the user's prompt
 * against the approved variants. Returns the canonical prompt text if
 * found, otherwise null so the caller can use the primary prompt.
 */
export function matchApprovedPrompt(
  scenario: DemoScenario,
  userPrompt: string,
): string | null {
  const norm = userPrompt.trim().toLowerCase().replace(/\s+/g, " ");
  if (!norm) return null;
  for (const candidate of scenario.prompts) {
    if (
      candidate.trim().toLowerCase().replace(/\s+/g, " ") === norm
    ) {
      return candidate;
    }
  }
  return null;
}
