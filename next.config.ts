import type { NextConfig } from "next";
import { execFileSync, type ExecFileSyncOptions } from "node:child_process";
import { readFileSync } from "node:fs";

/**
 * Human-facing semantic version (from package.json — the number we bump and
 * record in CHANGELOG.md). This is what users see ("v1.0.0").
 */
function resolveSemver(): string {
  if (process.env.npm_package_version) return process.env.npm_package_version;
  try {
    return JSON.parse(readFileSync("./package.json", "utf8")).version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

/**
 * Precise build identifier (git short SHA). Distinct from the semver: it
 * changes on EVERY deploy, so it's what busts the service worker
 * (/sw.js?v=<build>) even between deploys that share a version number. On
 * Vercel, VERCEL_GIT_COMMIT_SHA is provided automatically; locally we read
 * git; otherwise "dev".
 */
function resolveBuild(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    // execFile (no shell) with a fixed arg array — no injection surface.
    const opts: ExecFileSyncOptions = {};
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], opts)
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const APP_VERSION = resolveSemver();
const APP_BUILD = resolveBuild();

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Inlined into the client bundle so version + build are available everywhere.
  env: {
    NEXT_PUBLIC_APP_VERSION: APP_VERSION,
    NEXT_PUBLIC_APP_BUILD: APP_BUILD,
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
