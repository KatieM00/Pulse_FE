"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <header className="topnav">
      <Link href="/" className="topnav-brand" aria-label="Pulse">
        <img src="/pulse-logo.png" alt="Pulse" />
        <span className="pill-brand">Beta</span>
      </Link>

      <Link
        href="https://pulsebarbados.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline"
        style={{ fontSize: 13, padding: "8px 14px" }}
      >
        About Pulse
      </Link>
    </header>
  );
}
