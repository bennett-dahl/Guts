import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

const nextConfig: NextConfig = {
  // Phone/tablet on LAN: set ALLOWED_DEV_ORIGINS to the host shown under "Network:" in `next dev`
  // so HMR and dev assets are not blocked (see terminal warning about webpack-hmr).
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),
};

export default nextConfig;
