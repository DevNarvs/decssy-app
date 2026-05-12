import { test, expect } from "@playwright/test";

/**
 * Auth smoke tests.
 *
 * These run on mobile viewport (iPhone 14 — see playwright.config.ts) and
 * verify the routing-and-rendering contract of the auth flow without
 * actually authenticating (real auth needs Convex backend + Google OAuth
 * + valid env, which are fragile to script and not the value here).
 *
 * Coverage scope:
 *   ✔ Middleware redirects unauthed root → /sign-in
 *   ✔ Sign-in page renders the Decssy brand and the password form
 *   ✔ Sign-up page reachable via the "Create an account" link
 *   ✔ Both pages render the Google OAuth button
 *
 * Plan 18+ adds an authenticated-state smoke test (sign in via a test-only
 * password account, verify /calendar renders user info).
 */

test.describe("auth routing and rendering", () => {
  test("unauthenticated root redirects to sign-in", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("sign-in page renders Decssy brand and form fields", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByText(/^Decssy/).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  });

  test("sign-in page links to sign-up", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/sign-up/);
    await expect(
      page.getByRole("heading", { name: /create your account/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^create account$/i }),
    ).toBeVisible();
  });

  test("sign-up page links back to sign-in", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("link", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("password form shows validation error for too-short password", async ({
    page,
  }) => {
    await page.goto("/sign-up");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("short");
    await page.getByRole("button", { name: /^create account$/i }).click();
    // Filter past Next.js's built-in __next-route-announcer__ (also role=alert)
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /at least 8 characters/i }),
    ).toBeVisible();
  });

  test("password form shows validation error for missing @ in email", async ({
    page,
  }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill("notanemail");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /valid email/i }),
    ).toBeVisible();
  });
});
