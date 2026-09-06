/**
 * ``/theme/[id]`` — the "View all" landing for each themed section on
 * the home page. The grouped ``/api/feed?theme=<id>`` endpoint is the
 * single source of truth so the page always reflects the same
 * curated list the section card advertises. The card list is
 * rendered as the same :data:`FeedTheme` shape ``HomeFeed`` uses so
 * the theme page stays consistent with the front page.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import ThemePageClient from "./ThemePageClient";
import { getThemeMetadata } from "../../../../lib/themeMetadata";

export function generateStaticParams(): { id: string }[] {
  // One page per canonical theme id. Any unknown id returns a 404 from
  // App Router at build time and is excluded from the static export.
  return [
    { id: "events" },
    { id: "civic" },
    { id: "weather" },
    { id: "commerce" },
    { id: "sports" },
    { id: "community" },
    { id: "context" },
  ];
}

interface ThemePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ThemePageProps): Promise<Metadata> {
  const { id } = await params;
  const meta = getThemeMetadata(id);
  return {
    title: `${meta.fallback_headline} · Pulse Barbados`,
    description: meta.fallback_subtitle,
  };
}

export default async function ThemePage({ params }: ThemePageProps) {
  const { id } = await params;
  return (
    <main
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        padding: "32px 20px 80px",
      }}
    >
      <Suspense
        fallback={
          <p style={{ color: "#9CA3AF", fontSize: 14, textAlign: "center" }}>
            Loading…
          </p>
        }
      >
        <ThemePageClient themeId={id} />
      </Suspense>
    </main>
  );
}
