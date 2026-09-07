"use client";

import { useState } from "react";
import type { DemoScenario } from "@/lib/demoScenarios";
import type { SourceRef } from "@/lib/types";

interface DemoExplainerProps {
  scenario: DemoScenario;
  sources: SourceRef[];
}

/**
 * Renders a compact "Why this answer matters" panel between the answer
 * text and the source cards, for demo answers only. Returning users
 * can dismiss it. The panel is grounded in the actual sources the demo
 * used — it does NOT add claims that the source set doesn't support.
 */
export default function DemoExplainer({ scenario, sources }: DemoExplainerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  // Find the first radio source with a playable embed — the "Hear the
  // broadcast" CTA points at it. If none exists (e.g. an all-Instagram
  // demo), the CTA is hidden.
  const playableRadio = sources.find(
    (s) => s.kind === "radio" && s.embed && s.embed.startsWith("/radio/"),
  );

  const explanation = buildExplanation(scenario, sources.length);

  return (
    <div
      role="note"
      style={{
        margin: "8px 0 12px",
        padding: "14px 16px",
        background: "rgba(241, 54, 111, 0.05)",
        border: "1px solid rgba(241, 54, 111, 0.15)",
        borderLeft: "3px solid #F1366F",
        borderRadius: 12,
        fontSize: 13,
        lineHeight: 1.55,
        color: "#374151",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 6,
        }}
      >
        <p
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#F1366F",
          }}
        >
          Why this answer matters
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss explanation"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#9CA3AF",
            lineHeight: 1,
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      <p style={{ margin: "0 0 10px" }}>{explanation}</p>
      {playableRadio ? (
        <a
          href={playableRadio.embed}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: "#F1366F",
            textDecoration: "none",
          }}
        >
          ▶ Hear the original broadcast
        </a>
      ) : null}
    </div>
  );
}

function buildExplanation(scenario: DemoScenario, sourceCount: number): string {
  const id = scenario.id;
  const srcs = `${sourceCount} ${sourceCount === 1 ? "source" : "sources"}`;

  if (id === "circus") {
    return `The older event listing said Belle Junction; the radio broadcasts and visitor TikToks confirmed the move to Garrison Savannah. Pulse explained the change rather than silently picking one source. (Drawn from ${srcs}.)`;
  }
  if (id === "grand-market") {
    return `Most sources agreed on venue, dates and hours; one visitor TikTok disagreed on the closing date (31 vs 30 August). Pulse reported both windows and flagged which was the safer recommendation. (Drawn from ${srcs}.)`;
  }
  if (id === "cricket") {
    return `This story is unusual — every source is the radio broadcast itself. There's no article to link to; the audio IS the evidence. Pulse kept the four clearest live broadcast sources. (Drawn from ${srcs}.)`;
  }
  return `Demo answer drawn from ${srcs}.`;
}
