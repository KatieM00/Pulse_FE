"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGroupedFeed,
  fetchFlatFeed,
} from "@/lib/api";
import { FeedTheme, FeedItem } from "@/lib/types";
import { VISIBLE_COUNT } from "./SourceCard";
import ThemeSection from "./ThemeSection";
import styles from "./SourceList.module.css";

interface HomeFeedProps {
  /** Maximum number of themes to render. Defaults to 4 (matches the
   *  backend default). Capped at 7 server-side. */
  maxThemes?: number;
  /** Maximum number of source cards per theme. Defaults to 3. */
  itemsPerTheme?: number;
  /** Used by tests to inject a deterministic fetcher. */
  fetcher?: (options?: {
    maxThemes?: number;
    itemsPerTheme?: number;
  }) => Promise<FeedTheme[]>;
  /** Demo-mode flag — surfaces a "Demo snapshot" label, see issue #30. */
  demoLabel?: string;
}

const SCREEN_READER_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
};

export default function HomeFeed({
  maxThemes = 4,
  itemsPerTheme = 3,
  fetcher,
  demoLabel,
}: HomeFeedProps) {
  const [themes, setThemes] = useState<FeedTheme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeClipKey, setActiveClipKey] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const load = useCallback(async () => {
    setError(null);
    try {
      const fn = fetcher ?? fetchGroupedFeed;
      const next = await fn({ maxThemes, itemsPerTheme });
      setThemes(next);
    } catch (err) {
      // Keep ``themes === null`` so the error / retry branch renders
      // instead of the empty-state copy. ``loadAttempt`` lets the
      // retry button remount the fetch with a fresh signal.
      setThemes(null);
      setError(err instanceof Error ? err.message : "feed unavailable");
      setLoadAttempt((n) => n + 1);
    }
  }, [fetcher, maxThemes, itemsPerTheme]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void load();
  }, [load]);

  useEffect(() => () => setActiveClipKey(null), []);

  const handlePlayClip = useCallback((key: string) => {
    setActiveClipKey(key);
  }, []);

  const dedupedThemes = useMemo(() => {
    if (!themes) return themes;
    const seenSources = new Set<string>();
    const out: FeedTheme[] = [];
    for (const theme of themes) {
      const remaining: typeof theme.items = [];
      for (const item of theme.items) {
        const sourceKey = `${item.source_type}:${item.url}`;
        if (seenSources.has(sourceKey)) continue;
        seenSources.add(sourceKey);
        remaining.push(item);
      }
      if (remaining.length === 0) continue;
      out.push({ ...theme, items: remaining });
    }
    return out;
  }, [themes]);

  if (dedupedThemes === null) {
    if (error) {
      return (
        <section aria-label="What's on now">
          <div className={styles.errorCard} key={loadAttempt}>
            <p className={styles.errorText}>
              We couldn&apos;t load live sources. Check your connection and try again.
            </p>
            <button
              type="button"
              className={styles.moreButton}
              onClick={() => void load()}
            >
              Try again
            </button>
          </div>
        </section>
      );
    }
    return (
      <section aria-label="What's on now" aria-busy="true">
        {demoLabel && (
          <p className={styles.demoLabel} role="note">
            {demoLabel}
          </p>
        )}
        <div className={styles.list}>
          {Array.from({ length: maxThemes }).map((_, sectionIdx) => (
            <div key={sectionIdx} aria-hidden="true" style={{ marginBottom: 14 }}>
              <div
                style={{
                  height: 14,
                  width: "55%",
                  background:
                    "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.06) 100%)",
                  backgroundSize: "200% 100%",
                  animation: "skeletonShimmer 1.4s linear infinite",
                  borderRadius: 6,
                  marginBottom: 10,
                }}
              />
              {Array.from({ length: Math.min(itemsPerTheme, VISIBLE_COUNT) }).map(
                (_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className={styles.skeletonCard}
                    aria-hidden="true"
                  >
                    <div className={styles.skeletonPreview} />
                    <div className={styles.skeletonBody}>
                      <div className={styles.skeletonTitle} />
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                    </div>
                  </div>
                ),
              )}
            </div>
          ))}
          <span style={SCREEN_READER_ONLY}>Loading live feed</span>
        </div>
      </section>
    );
  }

  if (dedupedThemes.length === 0) {
    return (
      <section aria-label="What's on now">
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>
            No live sources right now. Try a question in the search above.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="What's on now">
      {demoLabel && (
        <p className={styles.demoLabel} role="note">
          {demoLabel}
        </p>
      )}
      {dedupedThemes.map((theme) => (
        <ThemeSection
          key={theme.id}
          theme={theme}
          activeClipKey={activeClipKey}
          onPlayClip={handlePlayClip}
          maxItems={itemsPerTheme}
        />
      ))}
    </section>
  );
}

/**
 * Flat-card adapter for tests and consumers that still expect the
 * ungrouped ``items`` shape. Returns an empty array when the backend
 * returns a themed response.
 */
export async function legacyFetchItems(limit = 20): Promise<FeedItem[]> {
  const body = await fetchFlatFeed(limit);
  if (!Array.isArray((body as { items?: unknown }).items)) {
    return [];
  }
  return (body as { items: FeedItem[] }).items;
}
