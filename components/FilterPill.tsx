"use client";

import { Category } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";

interface Props {
  category: Category;
  selected: boolean;
  onClick: () => void;
}

export default function FilterPill({ category, selected, onClick }: Props) {
  const color = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Filter by ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 14px",
        borderRadius: 20,
        border: selected ? `2px solid ${color}` : "0.5px solid rgba(0,0,0,0.15)",
        background: "#ffffff",
        cursor: "pointer",
        minHeight: 36,
        flexShrink: 0,
        transition: "border-color 0.15s",
      }}
    >
      {/* Category colour dot */}
      <span
        aria-hidden="true"
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 13,
          fontWeight: selected ? 600 : 400,
          color: selected ? color : "#4B5563",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </button>
  );
}
