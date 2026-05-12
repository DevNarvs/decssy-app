import { test, expect } from "@playwright/test";

/**
 * Invite flow smoke tests.
 *
 * Public/landing page tests run without auth.
 * Owner-flow tests skip when no auth is set up (same pattern as groups.spec.ts).
 */

test.describe("invite landing (public, no auth required)", () => {
  test("invalid token shows the not-valid landing", async ({ page }) => {
    await page.goto("/join/invalid-token-that-does-not-exist");
    await expect(
      page.getByRole("heading", { name: /invite not valid/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/expired.*revoked.*use limit/i),
    ).toBeVisible();
  });

  test("invalid-token landing still has metadata for crawlers", async ({
    page,
  }) => {
    await page.goto("/join/invalid-token-that-does-not-exist");
    // Page should have a title (sanity check that Next metadata pipeline runs)
    await expect(page).toHaveTitle(/decssy/i);
  });
});

test.describe("invite flow (auth required)", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip these tests in CI without auth setup.",
  );

  test("owner can open /groups/[id]/invite with QR + link", async ({
    page,
  }) => {
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(
        true,
        "Need a signed-in browser with an existing group. Sign in + create a group first.",
      );
    }

    const firstGroup = page.locator('a[href^="/groups/"]').first();
    if ((await firstGroup.count()) === 0) {
      test.skip(true, "Need at least one group to test invites.");
    }
    await firstGroup.click();
    await page.waitForLoadState("networkidle");

    const inviteCta = page.getByRole("link", { name: /invite people/i });
    if ((await inviteCta.count()) === 0) {
      test.skip(true, "Not the owner of this group.");
    }
    await inviteCta.click();

    await expect(page.getByRole("heading", { name: /^invite$/i })).toBeVisible();
    // QR loads asynchronously via Convex action — give it a moment.
    await expect(page.getByRole("img", { name: /qr code/i })).toBeVisible({
      timeout: 10_000,
    });
    // Invite URL input should be visible
    await expect(
      page.getByRole("textbox", { name: /share the link/i }),
    ).toBeVisible();
  });
});
