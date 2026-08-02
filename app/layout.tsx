import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

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
    <html lang="en" style={{ background: "#f0f0f0", height: "100%" }}>
      <body
        style={{
          background: "#f0f0f0",
          color: "#1A1A1A",
          height: "100%",
          margin: 0,
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {/* App shell: 480px centred column — mimics a phone on desktop */}
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            height: "100dvh",
            display: "flex",
            flexDirection: "column",
            background: "#ffffff",
            boxShadow: "0 0 0 0.5px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Page content area — pages manage their own scroll */}
          <main
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </main>

          {/* Bottom nav — part of the shell, not fixed */}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
