"use client";

import { ConfidenceLabel } from "@/lib/types";

const DOT_COLORS: Record<ConfidenceLabel, string> = {
  high: "#1D9E75",
  medium: "#EF9F27",
  low: "#9CA3AF",
  needs_review: "#D85A30",
};

const DOT_LABELS: Record<ConfidenceLabel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  needs_review: "Needs review",
};

interface Props {
  label: ConfidenceLabel;
}

export default function ConfidenceDot({ label }: Props) {
  const color = DOT_COLORS[label];
  const text = DOT_LABELS[label];

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
      aria-label={`Confidence: ${text}`}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 11,
          color: "#6B7280",
          lineHeight: 1,
          fontWeight: 400,
        }}
      >
        {text}
      </span>
    </span>
  );
}
