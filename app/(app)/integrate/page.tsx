"use client";

import { useState } from "react";
import Link from "next/link";

// ── Design tokens ─────────────────────────────────────────────────────────────
const ORANGE = "#EF9F27";
const GREEN = "#1D9E75";
const DARK = "#1A1A1A";
const MID = "#374151";
const LIGHT = "#6B7280";
const FAINT = "#9CA3AF";
const BORDER = "rgba(0,0,0,0.08)";

// ── Code content ──────────────────────────────────────────────────────────────
const JS_EXAMPLE = `const res = await fetch(
  "https://api.pulse.bb/agent/pulse",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "What's happening tonight?" }),
  }
);
const data = await res.json();
console.log(data.claims);`;

const CURL_EXAMPLE = `curl -X POST https://api.pulse.bb/agent/pulse \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What\\'s happening tonight?"}'`;

const JSON_EXAMPLE = `{
  "claim_id": "cl_01hxr3m9qw2vz8kn",
  "claim_type": "event_activity",
  "text": "Live music at Harbour Lights, Friday night",
  "topics": ["nightlife", "music"],
  "sentiment": {
    "label": "positive",
    "score": 0.74,
    "reason": "Upbeat language, no negative modifiers"
  },
  "entities": ["Harbour Lights", "St Lawrence Gap"],
  "supporting_sources": [
    {
      "source_id": "src_q1007",
      "url": "https://nationalnews.com/...",
      "observed_at": "2026-08-01T21:14:00Z",
      "excerpt": "Harbour Lights announced live sets from 9 pm Friday"
    },
    {
      "source_id": "src_tiktok_creator_xyz",
      "url": "https://tiktok.com/@bridgetownvibes/video/...",
      "observed_at": "2026-08-01T22:03:00Z",
      "excerpt": "Just pulled up to Harbour Lights — band is already on stage"
    }
  ],
  "confidence": "high",
  "confidence_reason": "Two independent sources, both recent, both with explicit time and place",
  "review_status": "confirmed"
}`;

// ── Field reference ───────────────────────────────────────────────────────────
const FIELDS = [
  {
    field: "claim_id",
    type: "string",
    desc: "Unique, stable identifier for this claim in the knowledge graph.",
  },
  {
    field: "claim_type",
    type: "string",
    desc: 'Category of claim. Common values: "event_activity", "travel_alert", "sentiment_signal".',
  },
  {
    field: "text",
    type: "string",
    desc: "Human-readable summary of the claim as extracted from source material.",
  },
  {
    field: "topics",
    type: "string[]",
    desc: "Taxonomy tags assigned by the Triage agent.",
  },
  {
    field: "sentiment",
    type: "object",
    desc: 'label ("positive" | "negative" | "neutral"), normalised score 0–1, and a brief reason string.',
  },
  {
    field: "entities",
    type: "string[]",
    desc: "Named entities extracted and resolved against the knowledge graph (places, people, organisations).",
  },
  {
    field: "supporting_sources",
    type: "object[]",
    desc: "Each source that contributed to this claim: its ID, original URL, UTC timestamp, and a short excerpt.",
  },
  {
    field: "confidence",
    type: '"high" | "medium" | "low" | "needs_review"',
    desc: "Output of the Confidence agent. Reflects source trust tier, recency, and number of corroborating sources.",
  },
  {
    field: "confidence_reason",
    type: "string",
    desc: "Plain-language explanation of why this confidence level was assigned.",
  },
  {
    field: "review_status",
    type: '"confirmed" | "pending" | "flagged"',
    desc: '"confirmed" = passed automated checks. "pending" = awaiting confidence threshold. "flagged" = queued for human review.',
  },
];

// ── Endpoint list ─────────────────────────────────────────────────────────────
const ENDPOINTS = [
  { method: "POST", path: "/agent/pulse",          note: "Full pulse summary — themes, entities, confidence" },
  { method: "POST", path: "/agent/topic-pulse",    note: "Pulse filtered to a specific topic" },
  { method: "POST", path: "/agent/sentiment-pulse",note: "Sentiment breakdown across active signals" },
  { method: "POST", path: "/agent/entity-pulse",   note: "Entity-centric view of current signals" },
  { method: "POST", path: "/agent/operator-brief", note: "Operator-level digest for dashboards" },
  { method: "POST", path: "/agent/build-itinerary",note: "Builds a user itinerary from confirmed events" },
  { method: "POST", path: "/agent/data-quality",   note: "Data quality report on ingested signals" },
  { method: "POST", path: "/agent/flag-review",    note: "Submit a claim for human review" },
  { method: "GET",  path: "/agent/provenance/{id}",note: "Full provenance chain for a claim ID" },
  { method: "GET",  path: "/dashboard/review-queue", note: "Current items queued for human review" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard not available in some contexts
    }
  }

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 6,
        border: `0.5px solid ${copied ? GREEN + "66" : BORDER}`,
        background: copied ? "#F0FDF8" : "rgba(255,255,255,0.08)",
        color: copied ? GREEN : FAINT,
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        flexShrink: 0,
      }}
    >
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  label,
  lang,
}: {
  code: string;
  label: string;
  lang: string;
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `0.5px solid rgba(255,255,255,0.08)`,
      }}
    >
      {/* Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: "#1E1E2E",
          borderBottom: "0.5px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ fontSize: 11, color: FAINT, fontWeight: 500 }}>{label}</span>
        <CopyButton text={code} />
      </div>
      {/* Code */}
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          background: "#13131F",
          overflowX: "auto",
          fontSize: 12,
          lineHeight: 1.7,
          color: "#CDD6F4",
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          whiteSpace: "pre",
        }}
        aria-label={`${lang} code example`}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: LIGHT,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        margin: "0 0 10px",
      }}
    >
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IntegratePage() {
  const [codeTab, setCodeTab] = useState<"js" | "curl">("js");

  return (
    <div style={{ background: "#ffffff", height: "100%", overflowY: "auto", overflowX: "hidden" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 12px",
          background: "#ffffff",
          borderBottom: `0.5px solid ${BORDER}`,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          aria-label="Back to home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none",
            color: LIGHT,
            fontSize: 14,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Link>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.4, color: DARK }}>
          Integrate Pulse
        </span>
        <span style={{ width: 52 }} />
      </header>

      {/* ── Intro ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "24px 20px 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#F3F4F6",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: LIGHT,
            marginBottom: 14,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          Developer docs
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: DARK,
            margin: "0 0 12px",
            lineHeight: 1.25,
            letterSpacing: -0.4,
          }}
        >
          Pulse is API-first
        </h1>
        <p style={{ fontSize: 14, color: MID, lineHeight: 1.65, margin: "0 0 10px" }}>
          The Pulse demo UI is one client of the same REST API that any external site
          or app can call directly. Endpoints return structured JSON — claims, entities,
          confidence labels and source links — ready to drop into your own product.
        </p>
        <p style={{ fontSize: 14, color: MID, lineHeight: 1.65, margin: 0 }}>
          <strong style={{ color: DARK }}>DayWeave</strong> is an example of the kind
          of third-party consumer this is designed for: a travel-planning app that pulls
          confirmed events and travel signals from Pulse and surfaces them alongside
          itinerary suggestions — without needing to build its own signal ingestion
          pipeline.
        </p>
      </section>

      {/* ── Auth notice ────────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "#FFFBEB",
            border: `1px solid ${ORANGE}44`,
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🔑</span>
          <div>
            <span
              style={{
                display: "inline-block",
                fontSize: 11,
                fontWeight: 700,
                color: ORANGE,
                letterSpacing: 0.4,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Coming soon
            </span>
            <p style={{ fontSize: 13, color: MID, margin: 0, lineHeight: 1.55 }}>
              API key authentication is not yet finalised. The examples below omit
              auth headers. When keys are issued, a single{" "}
              <code
                style={{
                  fontFamily: "monospace",
                  background: "rgba(0,0,0,0.06)",
                  borderRadius: 4,
                  padding: "1px 5px",
                  fontSize: 12,
                }}
              >
                Authorization: Bearer &lt;key&gt;
              </code>{" "}
              header will be added.
            </p>
          </div>
        </div>
      </section>

      {/* ── Code example ───────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 24px" }}>
        <SectionLabel>POST /agent/pulse — quick start</SectionLabel>

        {/* Tab switcher */}
        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 10,
            background: "#F3F4F6",
            borderRadius: 8,
            padding: 3,
            width: "fit-content",
          }}
        >
          {(["js", "curl"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCodeTab(tab)}
              style={{
                padding: "5px 14px",
                borderRadius: 6,
                border: "none",
                background: codeTab === tab ? "#ffffff" : "transparent",
                boxShadow: codeTab === tab ? "0 1px 3px rgba(0,0,0,0.10)" : "none",
                fontSize: 12,
                fontWeight: 600,
                color: codeTab === tab ? DARK : LIGHT,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {tab === "js" ? "JavaScript" : "curl"}
            </button>
          ))}
        </div>

        {codeTab === "js" ? (
          <CodeBlock code={JS_EXAMPLE} label="fetch (JavaScript)" lang="JavaScript" />
        ) : (
          <CodeBlock code={CURL_EXAMPLE} label="curl" lang="curl" />
        )}
      </section>

      {/* ── Example response ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 24px" }}>
        <SectionLabel>Example response</SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: LIGHT,
              background: "#F9FAFB",
              border: `0.5px solid ${BORDER}`,
              borderRadius: 6,
              padding: "3px 8px",
            }}
          >
            Illustrative — matches real claim schema
          </span>
        </div>
        <CodeBlock code={JSON_EXAMPLE} label="JSON response (example)" lang="JSON" />
      </section>

      {/* ── Field reference ─────────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 24px" }}>
        <SectionLabel>Field reference</SectionLabel>
        <div
          style={{
            borderRadius: 12,
            border: `0.5px solid ${BORDER}`,
            overflow: "hidden",
          }}
        >
          {FIELDS.map((row, i) => (
            <div
              key={row.field}
              style={{
                padding: "11px 14px",
                borderBottom: i < FIELDS.length - 1 ? `0.5px solid ${BORDER}` : "none",
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                <code
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: DARK,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                  }}
                >
                  {row.field}
                </code>
                <span
                  style={{
                    fontSize: 11,
                    color: FAINT,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                  }}
                >
                  {row.type}
                </span>
              </div>
              <p style={{ fontSize: 13, color: MID, margin: 0, lineHeight: 1.5 }}>
                {row.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Full endpoint list ──────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 24px" }}>
        <SectionLabel>All endpoints</SectionLabel>
        <div
          style={{
            borderRadius: 12,
            border: `0.5px solid ${BORDER}`,
            overflow: "hidden",
          }}
        >
          {ENDPOINTS.map((ep, i) => (
            <div
              key={ep.path}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 14px",
                borderBottom: i < ENDPOINTS.length - 1 ? `0.5px solid ${BORDER}` : "none",
                background: i % 2 === 0 ? "#ffffff" : "#FAFAFA",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: ep.method === "POST" ? ORANGE : GREEN,
                  background: ep.method === "POST" ? ORANGE + "15" : GREEN + "15",
                  border: `1px solid ${ep.method === "POST" ? ORANGE + "44" : GREEN + "44"}`,
                  borderRadius: 5,
                  padding: "2px 6px",
                  flexShrink: 0,
                  marginTop: 1,
                  fontFamily: "monospace",
                }}
              >
                {ep.method}
              </span>
              <div>
                <code
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: DARK,
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    marginBottom: 2,
                  }}
                >
                  {ep.path}
                </code>
                <span style={{ fontSize: 12, color: LIGHT }}>{ep.note}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works link ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 20px 32px" }}>
        <Link
          href="/how-it-works"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 12,
            border: `0.5px solid ${BORDER}`,
            background: "#FAFAFA",
            color: DARK,
            textDecoration: "none",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              How Pulse Works
            </div>
            <div style={{ fontSize: 12, color: LIGHT }}>
              Pipeline overview, confidence model, source adapters
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={FAINT}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </section>

    </div>
  );
}
