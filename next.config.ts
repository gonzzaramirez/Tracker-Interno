import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Boards can embed pasted images as base64 data URLs, which easily
      // exceed the default 1 MB action body limit (a single screenshot can
      // already do it). Keep headroom over the scene size guard in
      // lib/services/boards.ts (32 MB).
      bodySizeLimit: "40mb",
    },
  },
};

export default nextConfig;
