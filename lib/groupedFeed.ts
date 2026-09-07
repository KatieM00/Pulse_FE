/**
 * Pure helpers for the themed home feed response.
 *
 * Kept separate from ``lib/api.ts`` so the test suite can exercise
 * the parser/mapper without touching the fetch global or the network.
 */

import type { FeedResponse, FeedTheme } from "./types";

const VALID_ACCENTS = new Set([
  "green",
  "orange",
  "purple",
  "blue",
  "amber",
  "teal",
  "grey",
] as const);

/**
 * Narrow :data:`FeedResponse` to the themed variant and apply the
 * client-side normalisation rules:
 *
 * 1. Drop themes whose ``items`` array is missing or empty.
 * 2. Cap the theme list at ``maxThemes`` (default 4).
 * 3. Coerce ``accent`` to one of the known palette tokens.
 *
 * Returns an empty list when the body is the legacy ``{items}``
 * shape, when ``themes`` is missing, or when the type guard fails.
 */
export function normaliseGroupedFeed(
  body: FeedResponse,
  options: { maxThemes?: number; itemsPerTheme?: number } = {},
): FeedTheme[] {
  if (!body || typeof body !== "object") return [];
  const themes = (body as { themes?: unknown }).themes;
  if (!Array.isArray(themes)) return [];

  const maxThemes = Math.max(1, Math.min(options.maxThemes ?? 4, 7));
  const itemsPerTheme = Math.max(0, Math.min(options.itemsPerTheme ?? 3, 10));

  const out: FeedTheme[] = [];
  for (const theme of themes) {
    if (!theme || typeof theme !== "object") continue;
    const next = theme as Partial<FeedTheme>;
    if (!Array.isArray(next.items) || next.items.length === 0) continue;
    const accent: FeedTheme["accent"] =
      typeof next.accent === "string" &&
      VALID_ACCENTS.has(next.accent as FeedTheme["accent"])
        ? (next.accent as FeedTheme["accent"])
        : "grey";
    const id = typeof next.id === "string" && next.id ? next.id : "theme";
    const icon = typeof next.icon === "string" && next.icon ? next.icon : "✨";
    const headline =
      typeof next.headline === "string" && next.headline
        ? next.headline
        : "Latest signals";
    const subtitle = typeof next.subtitle === "string" ? next.subtitle : "";
    const viewAll =
      typeof next.view_all === "string" && next.view_all
        ? next.view_all
        : `/theme/${id}`;

    out.push({
      id,
      icon,
      accent,
      headline,
      subtitle,
      view_all: viewAll,
      items: next.items.slice(0, itemsPerTheme),
      ...(typeof next.claim_count === "number"
        ? { claim_count: next.claim_count }
        : {}),
    });

    if (out.length >= maxThemes) break;
  }

  return out;
}

export function isGroupedFeed(body: FeedResponse): boolean {
  return Array.isArray((body as { themes?: unknown })?.themes);
}
