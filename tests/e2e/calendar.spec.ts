import { test, expect } from "@playwright/test";

/**
 * Calendar tab smoke tests. Public-only — auth-required deeper tests
 * skip when the test browser isn't signed in.
 */

test.describe("calendar tab", () => {
  test("unauthed /calendar redirects to /sign-in", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("calendar UI (auth required)", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip auth-required tests.",
  );

  test("authed user sees month grid + brand wordmark", async ({ page }) => {
    await page.goto("/calendar");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }
    // Decssy brand wordmark
    await expect(page.getByText(/^Decssy/).first()).toBeVisible();
    // Day-name header row (S M T W T F S)
    await expect(page.getByText("S").first()).toBeVisible();
  });
});
