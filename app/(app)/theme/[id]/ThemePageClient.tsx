"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchGroupedFeed } from "@/lib/api";
import { FeedTheme } from "@/lib/types";
import ThemeSection from "@/components/ThemeSection";
import { getThemeMetadata } from "@/lib/themeMetadata";
import styles from "@/components/ThemeSection.module.css";

interface ThemePageClientProps {
  themeId: string;
}

const ACCENT_TO_STRIPE: Record<string, string> = {
  green: styles.accentGreen,
  orange: styles.accentOrange,
  purple: styles.accentPurple,
  blue: styles.accentBlue,
  amber: styles.accentAmber,
  teal: styles.accentTeal,
  grey: styles.accentGrey,
};

export default function ThemePageClient({ themeId }: ThemePageClientProps) {
  const meta = useMemo(() => getThemeMetadata(themeId), [themeId]);
  const [themes, setThemes] = useState<FeedTheme[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchGroupedFeed({
          maxThemes: 1,
          itemsPerTheme: 12,
          theme: themeId,
        });
        if (!cancelled) setThemes(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "feed unavailable");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [themeId]);

  if (error) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#6B7280", fontSize: 13 }}>
          ← Back to home
        </Link>
        <p style={{ marginTop: 24, color: "#1F2937", fontSize: 16 }}>
          {meta.icon} {meta.fallback_headline}
        </p>
        <p style={{ marginTop: 8, color: "#6B7280", fontSize: 14 }}>
          {meta.fallback_subtitle}
        </p>
        <p style={{ marginTop: 24, color: "#B91C1C", fontSize: 14 }}>
          We couldn&apos;t load live sources. Check your connection and try again.
        </p>
      </div>
    );
  }

  if (!themes) {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#6B7280", fontSize: 13 }}>
          ← Back to home
        </Link>
        <p
          style={{
            marginTop: 24,
            color: "#9CA3AF",
            fontSize: 14,
          }}
        >
          Loading…
        </p>
      </div>
    );
  }

  const accent = themes[0]?.accent ?? meta.accent;
  const stripeClass = ACCENT_TO_STRIPE[accent] ?? styles.accentGrey;
  const theme = themes[0];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <Link href="/" style={{ color: "#6B7280", fontSize: 13 }}>
        ← Back to home
      </Link>
      {theme ? (
        <ThemeSection
          theme={theme}
          activeClipKey={null}
          onPlayClip={() => {}}
          maxItems={theme.items.length}
        />
      ) : (
        <div style={{ marginTop: 24 }}>
          <span
            className={`${styles.accentStripe} ${stripeClass}`}
            aria-hidden="true"
            style={{ display: "block", width: 60, height: 4, marginBottom: 12 }}
          />
          <h1 style={{ fontSize: 24, color: "#111827", margin: 0 }}>
            {meta.icon} {meta.fallback_headline}
          </h1>
          <p style={{ marginTop: 8, color: "#6B7280", fontSize: 14 }}>
            {meta.fallback_subtitle}
          </p>
          <p style={{ marginTop: 24, color: "#6B7280", fontSize: 14 }}>
            Nothing new in this theme right now.
          </p>
        </div>
      )}
    </div>
  );
}
