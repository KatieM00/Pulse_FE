"use client";

import { Category } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";

// Category icon characters (simple text glyphs, no external icon lib needed)
const CATEGORY_ICONS: Record<Category, string> = {
  soca: "♪",
  beach: "◉",
  music: "♫",
  culture: "◆",
  market: "◈",
};

interface Props {
  category: Category;
  size?: "sm" | "md";
}

export default function CategoryChip({ category, size = "md" }: Props) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];
  const icon = CATEGORY_ICONS[category];

  const dim = size === "sm" ? 36 : 44;
  const fontSize = size === "sm" ? 14 : 18;

  return (
    <span
      aria-label={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: 10,
        backgroundColor: `${color}18`,
        color: color,
        fontSize: fontSize,
        flexShrink: 0,
        fontWeight: 600,
      }}
    >
      <span aria-hidden="true">{icon}</span>
    </span>
  );
}
