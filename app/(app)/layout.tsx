import type { Metadata, Viewport } from "next";
import "../globals.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Pulse — Caribbean Signal Intelligence",
  description: "Live from radio, news and social, across the Caribbean.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ background: "var(--bg)", height: "100%" }}>
      <body
        style={{
          background: "var(--bg)",
          color: "var(--ink)",
          margin: 0,
          padding: 0,
          minHeight: "100dvh",
        }}
      >
        {/* App shell — full-width editorial surface, no phone mockup */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100dvh",
          }}
        >
          <TopNav />

          {/* Page content area — pages manage their own scroll */}
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
