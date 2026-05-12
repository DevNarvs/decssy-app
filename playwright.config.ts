import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config.
 *
 * Tests target whichever URL the dev server is actually on:
 *   - PLAYWRIGHT_BASE_URL env var wins if set (e.g., CI or non-default port)
 *   - Defaults to http://localhost:3000
 *
 * We deliberately don't auto-spawn `npm run dev` here. Reason: this project's
 * dev port is unstable (3000 often taken by sibling projects), so a fixed
 * webServer config would fail more often than it'd help. Run `npm run dev`
 * yourself in another terminal, then `npm run test:e2e`.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "list",
  timeout: 30 * 1000,
  expect: { timeout: 5 * 1000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      // Pixel 7 uses Chromium (vs iPhone profiles which use WebKit).
      // We test on Chromium only in Plan 1; WebKit/Firefox can be added in
      // Plan 10 (Polish) once browser-specific bugs become a real risk.
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
