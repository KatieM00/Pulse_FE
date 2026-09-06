/**
 * Mirror of the backend theme palette so the static ``/theme/[id]``
 * page can render a usable fallback headline before the live API
 * responds. Sourced from ``pulse.retrieval.THEME_METADATA`` on the
 * API side — keep the two in sync when adding or renaming themes.
 */

export interface ThemeMeta {
  id: string;
  icon: string;
  accent: string;
  fallback_headline: string;
  fallback_subtitle: string;
}

const METADATA: Record<string, ThemeMeta> = {
  events: {
    id: "events",
    icon: "🎉",
    accent: "purple",
    fallback_headline: "Local events happening now",
    fallback_subtitle: "Events, fixtures and schedules from across Barbados.",
  },
  civic: {
    id: "civic",
    icon: "🚧",
    accent: "amber",
    fallback_headline: "Civic notices and travel updates",
    fallback_subtitle: "Public notices, traffic and transport updates.",
  },
  weather: {
    id: "weather",
    icon: "⛅",
    accent: "blue",
    fallback_headline: "Weather across Barbados",
    fallback_subtitle: "Local forecasts and weather warnings.",
  },
  commerce: {
    id: "commerce",
    icon: "🍽",
    accent: "orange",
    fallback_headline: "Deals, specials and things to do",
    fallback_subtitle: "Promotions and local activity offerings.",
  },
  sports: {
    id: "sports",
    icon: "🏏",
    accent: "green",
    fallback_headline: "Sport talk",
    fallback_subtitle: "Match results and sports coverage from around the island.",
  },
  community: {
    id: "community",
    icon: "🕊",
    accent: "grey",
    fallback_headline: "Island community news",
    fallback_subtitle: "Notices and reflections from across the community.",
  },
  context: {
    id: "context",
    icon: "💬",
    accent: "teal",
    fallback_headline: "Island buzz and chatter",
    fallback_subtitle: "What Bajans are saying across socials and the island.",
  },
};

export function getThemeMetadata(themeId: string): ThemeMeta {
  const found = METADATA[themeId];
  if (found) return found;
  return {
    id: themeId,
    icon: "✨",
    accent: "teal",
    fallback_headline: themeId.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    fallback_subtitle: "Recent activity.",
  };
}
