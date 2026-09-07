"use client";

import Link from "next/link";

// ── Design tokens (matched to existing pages) ─────────────────────────────────
const ORANGE = "#EF9F27";
const GREEN = "#1D9E75";
const RED = "#D85A30";
const GRAY = "#9CA3AF";
const DARK = "#1A1A1A";
const MID = "#374151";
const LIGHT = "#6B7280";
const BORDER = "rgba(0,0,0,0.08)";

// ── Confidence badge (mirrors ConfidenceDot visual language) ──────────────────
const BADGE_STYLES: Record<string, { dot: string; bg: string; label: string }> = {
  high:        { dot: GREEN,  bg: "#F0FDF8", label: "High confidence" },
  medium:      { dot: ORANGE, bg: "#FFFBEB", label: "Medium confidence" },
  low:         { dot: GRAY,   bg: "#F9FAFB", label: "Low confidence" },
  needs_review:{ dot: RED,    bg: "#FFF5F2", label: "Needs review" },
};

function ConfidenceBadge({ level }: { level: keyof typeof BADGE_STYLES }) {
  const s = BADGE_STYLES[level];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: s.bg,
        border: `1px solid ${s.dot}33`,
        borderRadius: 20,
        padding: "3px 9px 3px 7px",
        fontSize: 12,
        color: MID,
        fontWeight: 500,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
}

// ── Source chip (mirrors EventRow source chips) ───────────────────────────────
function SourceChip({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#F3F4F6",
        border: `0.5px solid ${BORDER}`,
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 12,
        color: MID,
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </span>
  );
}

// ── Flow diagram step ─────────────────────────────────────────────────────────
function FlowStep({
  icon,
  label,
  sub,
  last,
}: {
  icon: string;
  label: string;
  sub?: string;
  last?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, flex: last ? "none" : 1, minWidth: 0 }}>
      {/* Step box */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "#F9FAFB",
            border: `0.5px solid ${BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: DARK,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              fontSize: 10,
              color: LIGHT,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {sub}
          </span>
        )}
      </div>

      {/* Arrow — not after last step */}
      {!last && (
        <div
          style={{
            color: GRAY,
            fontSize: 14,
            flexShrink: 0,
            paddingBottom: 18,
            lineHeight: 1,
          }}
        >
          →
        </div>
      )}
    </div>
  );
}

// ── Agent row (tech section) ──────────────────────────────────────────────────
function AgentRow({
  n,
  name,
  desc,
}: {
  n: number;
  name: string;
  desc: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: `0.5px solid ${BORDER}`,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: ORANGE + "22",
          color: ORANGE,
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {n}
      </span>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{name}</span>
        <span style={{ fontSize: 13, color: LIGHT }}> — {desc}</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
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
          How Pulse Works
        </span>
        <span style={{ width: 52 }} />
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — Plain-language overview
      ════════════════════════════════════════════════════════════════════ */}

      {/* Hero */}
      <section style={{ padding: "28px 20px 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: ORANGE + "15",
            border: `1px solid ${ORANGE}33`,
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: ORANGE,
            marginBottom: 14,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ORANGE, display: "inline-block" }} />
          Live signal intelligence
        </div>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: DARK,
            margin: "0 0 12px",
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}
        >
          Barbados, cross-checked in real time
        </h1>
        <p style={{ fontSize: 15, color: MID, lineHeight: 1.6, margin: 0 }}>
          Information about what&apos;s happening in Barbados is scattered across radio
          stations, TikTok clips and newspaper websites — often arriving at different
          times and with different details. Pulse listens to all of it at once,
          cross-checks the signals against each other, and tells you what&apos;s
          confirmed, what&apos;s unverified and what still needs a human look.
        </p>
      </section>

      {/* Flow diagram */}
      <section style={{ padding: "4px 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          How a signal becomes a briefing
        </p>

        <div
          style={{
            background: "#FAFAFA",
            borderRadius: 14,
            border: `0.5px solid ${BORDER}`,
            padding: "16px 12px",
          }}
        >
          {/* Row 1: sources */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 12 }}>
            <FlowStep icon="📻" label="Radio" sub="live stream" />
            <FlowStep icon="🎵" label="TikTok" sub="local clips" />
            <FlowStep icon="📰" label="News" sub="online press" last />
          </div>

          {/* Down arrow */}
          <div style={{ textAlign: "center", color: GRAY, fontSize: 16, marginBottom: 12, lineHeight: 1 }}>
            ↓
          </div>

          {/* Row 2: pipeline */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 12 }}>
            <FlowStep icon="🤖" label="6 Agents" sub="CrewAI pipeline" last />
          </div>

          {/* Down arrow */}
          <div style={{ textAlign: "center", color: GRAY, fontSize: 16, marginBottom: 12, lineHeight: 1 }}>
            ↓
          </div>

          {/* Row 3: knowledge graph + briefing */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
            <FlowStep icon="🕸" label="Knowledge" sub="graph" />
            <FlowStep icon="📋" label="Pulse" sub="Briefing" last />
          </div>
        </div>
      </section>

      {/* What gets shown */}
      <section style={{ padding: "0 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Every result you see carries
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "🔗", text: "A link to the original source" },
            { icon: "🕐", text: "A timestamp showing when it was heard" },
            { icon: "✅", text: "A confidence label based on cross-checking" },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#F9FAFB",
                borderRadius: 10,
                padding: "10px 14px",
                border: `0.5px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 14, color: MID }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Confidence labels visual */}
      <section style={{ padding: "0 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 14px",
          }}
        >
          Confidence labels
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ConfidenceBadge level="high" />
          <ConfidenceBadge level="medium" />
          <ConfidenceBadge level="low" />
          <ConfidenceBadge level="needs_review" />
        </div>
      </section>

      {/* Example card */}
      <section style={{ padding: "0 20px 32px" }}>
        <div
          style={{
            borderRadius: 14,
            border: `1px solid ${GREEN}44`,
            background: "#F0FDF8",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>💡</span>
            <span
              style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: 0.3 }}
            >
              Example
            </span>
          </div>
          <p style={{ fontSize: 14, color: MID, lineHeight: 1.6, margin: "0 0 12px" }}>
            Pulse hears an event mentioned on the radio and then sees it filmed on
            TikTok. Because two independent sources agree, it shows up as{" "}
            <strong style={{ color: DARK }}>high confidence</strong>. If only one source
            has mentioned it, the claim appears as{" "}
            <strong style={{ color: DARK }}>medium</strong> or{" "}
            <strong style={{ color: DARK }}>needs review</strong> until more signals
            arrive.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SourceChip icon="📻" label="VOB 92.9" />
            <SourceChip icon="🎵" label="@bridgetownvibes" />
            <ConfidenceBadge level="high" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <div
        style={{
          margin: "0 20px",
          borderTop: `0.5px solid ${BORDER}`,
          marginBottom: 0,
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — Technical detail
      ════════════════════════════════════════════════════════════════════ */}

      <section style={{ padding: "28px 20px 20px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#F3F4F6",
            border: `0.5px solid ${BORDER}`,
            borderRadius: 20,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            marginBottom: 14,
          }}
        >
          Developer notes
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: DARK,
            margin: "0 0 6px",
            letterSpacing: -0.3,
          }}
        >
          Under the hood
        </h2>
        <p style={{ fontSize: 14, color: LIGHT, margin: 0, lineHeight: 1.5 }}>
          How the pipeline, adapters and confidence model fit together.
        </p>
      </section>

      {/* Six-agent pipeline */}
      <section style={{ padding: "0 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 4px",
          }}
        >
          CrewAI pipeline — six agents
        </p>
        <div
          style={{
            borderRadius: 12,
            border: `0.5px solid ${BORDER}`,
            overflow: "hidden",
          }}
        >
          <AgentRow n={1} name="Triage"       desc="classifies incoming signals by topic, urgency and source type." />
          <AgentRow n={2} name="Extraction"   desc="pulls structured entities, claims and metadata from raw text or transcript." />
          <AgentRow n={3} name="Resolution"   desc="deduplicates and links claims to existing knowledge-graph nodes." />
          <AgentRow n={4} name="Confidence"   desc="scores each claim using source tier, recency and corroboration count." />
          <AgentRow n={5} name="Human review" desc="flags claims that fall below the confidence threshold or touch sensitive topics." />
          <div style={{ padding: "10px 0 0" }}>
            <AgentRow n={6} name="Briefing synthesis" desc="composes the final human-readable briefing from confirmed claims." />
          </div>
        </div>
      </section>

      {/* Source adapter pattern */}
      <section style={{ padding: "0 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          Source adapter pattern
        </p>
        <div
          style={{
            background: "#F9FAFB",
            borderRadius: 12,
            border: `0.5px solid ${BORDER}`,
            padding: "14px",
          }}
        >
          <p style={{ fontSize: 14, color: MID, lineHeight: 1.6, margin: "0 0 12px" }}>
            Every source — radio, TikTok, newspaper — implements the same adapter
            interface. The pipeline receives a normalised signal object regardless of
            where it came from, so adding a new source means writing one adapter, not
            touching the agents.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <SourceChip icon="📻" label="Radio adapter" />
            <SourceChip icon="🎵" label="TikTok adapter" />
            <SourceChip icon="📰" label="News adapter" />
          </div>
        </div>
      </section>

      {/* Confidence model */}
      <section style={{ padding: "0 20px 24px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          Confidence model
        </p>
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: 12,
            border: `1px solid ${ORANGE}33`,
            padding: "14px",
          }}
        >
          <p style={{ fontSize: 14, color: MID, lineHeight: 1.6, margin: 0 }}>
            Score = <strong style={{ color: DARK }}>source trust tier</strong> ×{" "}
            <strong style={{ color: DARK }}>recency</strong> ×{" "}
            <strong style={{ color: DARK }}>number of corroborating sources</strong>,
            minus a penalty for missing required fields, capped downward for claims
            flagged as sensitive topics.
          </p>
        </div>
      </section>

      {/* API link */}
      <section style={{ padding: "0 20px 32px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: LIGHT,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          Build on Pulse
        </p>
        <Link
          href="/chat"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: 12,
            border: `2px solid ${ORANGE}`,
            background: "#ffffff",
            color: DARK,
            textDecoration: "none",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              Integration &amp; API examples
            </div>
            <div style={{ fontSize: 12, color: LIGHT }}>
              Query Pulse and build on top of its knowledge graph
            </div>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ORANGE}
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
