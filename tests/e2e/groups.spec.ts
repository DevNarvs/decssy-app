import { test, expect } from "@playwright/test";

/**
 * Onboarding + groups smoke tests.
 *
 * These tests assume Plan 1's auth is working and that the user has
 * SIGNED IN MANUALLY at least once in the test browser (Playwright will
 * use localStorage tokens from that session). For a fully automated CI
 * setup, we'd add a global-setup that signs in once and persists state —
 * tracked for Plan 10 (Polish).
 *
 * Skip via SKIP_AUTH_TESTS=1 if you want to run only Plan 1's auth tests.
 */

test.describe("groups smoke flow", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip these tests in CI without auth setup.",
  );

  test("groups page renders (when authed)", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");

    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(
        true,
        "Need a signed-in + onboarded browser. Sign in manually first.",
      );
    }

    await expect(
      page.getByRole("heading", { name: /^groups/i }),
    ).toBeVisible();
  });

  test("create group form validates required name", async ({ page }) => {
    await page.goto("/groups/new");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }

    await page.getByRole("button", { name: /^create group$/i }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: /give your group a name/i }),
    ).toBeVisible();
  });

  test("create group → appears in list → settings → delete", async ({
    page,
  }) => {
    const groupName = `Test ${Date.now()}`;
    await page.goto("/groups/new");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }

    await page.getByLabel(/name/i).fill(groupName);
    await page.getByRole("button", { name: /^create group$/i }).click();

    // Redirect to /groups/<id>
    await page.waitForURL(/\/groups\/[a-z0-9]+$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible();

    // Navigate back to list, see the group.
    await page.goto("/groups");
    await expect(page.getByText(groupName).first()).toBeVisible();

    // Open detail then settings, delete.
    await page.getByText(groupName).first().click();
    await page.getByRole("link", { name: /group settings/i }).click();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /delete this group/i }).click();

    // Should return to /groups; group gone.
    await page.waitForURL(/\/groups\/?$/, { timeout: 10_000 });
    await expect(page.getByText(groupName)).toHaveCount(0);
  });
});
