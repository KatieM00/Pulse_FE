"use client";

import Link from "next/link";
import { SourceCard, sourceCardFromFeed } from "./SourceCard";
import { FeedItem, FeedTheme } from "@/lib/types";
import styles from "./ThemeSection.module.css";

const ACCENT_TO_STRIPE: Record<string, string> = {
  green: styles.accentGreen,
  orange: styles.accentOrange,
  purple: styles.accentPurple,
  blue: styles.accentBlue,
  amber: styles.accentAmber,
  teal: styles.accentTeal,
  grey: styles.accentGrey,
};

const ACCENT_TO_ICON_CHIP: Record<string, string> = {
  green: styles.iconChipGreen,
  orange: styles.iconChipOrange,
  purple: styles.iconChipPurple,
  blue: styles.iconChipBlue,
  amber: styles.iconChipAmber,
  teal: styles.iconChipTeal,
  grey: styles.iconChipGrey,
};

const ACCENT_TO_VIEW_ALL: Record<string, string> = {
  green: styles.viewAllGreen,
  orange: styles.viewAllOrange,
  purple: styles.viewAllPurple,
  blue: styles.viewAllBlue,
  amber: styles.viewAllAmber,
  teal: styles.viewAllTeal,
  grey: styles.viewAllGrey,
};

export interface ThemeSectionProps {
  theme: FeedTheme;
  activeClipKey: string | null;
  onPlayClip: (key: string) => void;
  /**
   * Cap on how many cards render in the section. The backend caps the
   * payload server-side; this is a defensive client-side guard for
   * debug payloads or future variants.
   */
  maxItems?: number;
}

export default function ThemeSection({
  theme,
  activeClipKey,
  onPlayClip,
  maxItems,
}: ThemeSectionProps) {
  const items: FeedItem[] =
    typeof maxItems === "number"
      ? theme.items.slice(0, Math.max(0, maxItems))
      : theme.items;

  if (items.length === 0) return null;

  const accent = theme.accent ?? "grey";
  const stripeClass = ACCENT_TO_STRIPE[accent] ?? styles.accentGrey;
  const iconClass = ACCENT_TO_ICON_CHIP[accent] ?? styles.iconChipGrey;
  const viewAllClass = ACCENT_TO_VIEW_ALL[accent] ?? styles.viewAllGrey;

  const viewAllHref = theme.view_all || `/theme/${theme.id}`;

  return (
    <section
      className={styles.section}
      aria-label={`${theme.headline} section`}
    >
      <span className={`${styles.accentStripe} ${stripeClass}`} aria-hidden="true" />
      <div className={styles.header}>
        <span className={`${styles.iconChip} ${iconClass}`} aria-hidden="true">
          {theme.icon || "✨"}
        </span>
        <div className={styles.textColumn}>
          <h3 className={styles.headline}>{theme.headline}</h3>
          {theme.subtitle && (
            <p className={styles.subtitle}>{theme.subtitle}</p>
          )}
        </div>
        <Link
          href={viewAllHref}
          className={`${styles.viewAll} ${viewAllClass}`}
          aria-label={`View all ${theme.headline}`}
        >
          View all
          <svg
            className={styles.viewAllChevron}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
      <div className={styles.cardList} aria-label={theme.headline}>
        {items.map((item) => (
          <SourceCard
            key={`${theme.id}-${item.source_type}-${item.url}`}
            source={sourceCardFromFeed(item)}
            variant="feed"
            activeClipKey={activeClipKey}
            onPlayClip={onPlayClip}
          />
        ))}
      </div>
    </section>
  );
}
