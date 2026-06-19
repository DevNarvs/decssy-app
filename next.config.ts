import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

/**
 * Build-time app version, shown in Settings and used to bust the service
 * worker on each deploy (registered as /sw.js?v=<version>). On Vercel,
 * VERCEL_GIT_COMMIT_SHA is provided automatically; locally we read git;
 * otherwise "dev".
 */
function resolveAppVersion(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    // execFile (no shell) with a fixed arg array — no injection surface.
    return execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();
  } catch {
    return "dev";
  }
}

const APP_VERSION = resolveAppVersion();

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Inlined into the client bundle so the version is available everywhere.
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
  },

  async headers() {
    return [
      {
        // Never cache the service worker — it must be the freshest file we serve,
        // otherwise users get stuck on a stale offline-mode forever.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // The manifest can cache briefly so the browser doesn't refetch it on every load,
        // but should still update within an hour of a deploy.
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
      },
    ];
  },
};

export default nextConfig;
