import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` emits plain HTML/CSS/JS into `out/`,
  // served by Caddy on app.pulsebarbados.com (no Node runtime needed).
  output: "export",
  images: {
    // Static export has no image-optimization server; media comes from
    // remote sources (picsum mocks, social embeds) anyway.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
