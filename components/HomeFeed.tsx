"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeed } from "@/lib/api";
import { FeedItem } from "@/lib/types";
import {
  SourceCard,
  sourceCardFromFeed,
  VISIBLE_COUNT,
} from "./SourceCard";
import styles from "./SourceList.module.css";

interface HomeFeedProps {
  /** Initial limit used by the home fetch; ``VISIBLE_COUNT`` is the first-paint cap. */
  limit?: number;
  /** Used by tests to inject a deterministic fetcher. */
  fetcher?: (limit: number) => Promise<{ items: FeedItem[] }>;
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
  limit = 8,
  fetcher,
  demoLabel,
}: HomeFeedProps) {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeClipKey, setActiveClipKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const fn = fetcher ?? fetchFeed;
      const body = await fn(limit);
      setItems(body.items ?? []);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "feed unavailable");
    }
  }, [fetcher, limit]);

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

  const visible = items
    ? expanded
      ? items
      : items.slice(0, VISIBLE_COUNT)
    : [];
  const remaining = items ? Math.max(0, items.length - VISIBLE_COUNT) : 0;

  if (items === null) {
    if (error) {
      return (
        <section aria-label="What's on now">
          <div className={styles.errorCard}>
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
          {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} aria-hidden="true">
              <div className={styles.skeletonPreview} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
              </div>
            </div>
          ))}
          <span style={SCREEN_READER_ONLY}>Loading live feed</span>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
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
      <div className={styles.list} aria-label="Live sources">
        {visible.map((item) => (
          <SourceCard
            key={`${item.source_type}-${item.url}`}
            source={sourceCardFromFeed(item)}
            variant="feed"
            activeClipKey={activeClipKey}
            onPlayClip={handlePlayClip}
          />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            className={styles.moreButton}
            onClick={() => setExpanded(true)}
            aria-expanded={expanded}
          >
            Show {remaining} more {remaining === 1 ? "source" : "sources"}
            <span style={SCREEN_READER_ONLY}>
              {" "}
              (expands the list of live sources below)
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
