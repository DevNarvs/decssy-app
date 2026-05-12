import { test, expect } from "@playwright/test";

/**
 * Events flow smoke tests.
 *
 * Public-only check: unauthed users hitting an events route get redirected
 * to /sign-in (middleware protection). Auth-required deeper tests skip when
 * the test browser isn't signed in.
 */

test.describe("events routing (public)", () => {
  test("unauthed access to /groups/<id>/events/new redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/groups/anything/events/new");
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("unauthed access to /groups/<id>/events/<eid> redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/groups/anything/events/anyevent");
    await page.waitForURL(/\/sign-in/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});

test.describe("events flow (auth required)", () => {
  test.skip(
    !!process.env.SKIP_AUTH_TESTS,
    "Set SKIP_AUTH_TESTS=1 to skip auth-required tests.",
  );

  test("create event form validates required title", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForLoadState("networkidle");
    if (
      page.url().includes("/sign-in") ||
      page.url().includes("/welcome")
    ) {
      test.skip(true, "Sign in + complete onboarding before running this test.");
    }
    const firstGroup = page.locator('a[href^="/groups/"]').first();
    if ((await firstGroup.count()) === 0) {
      test.skip(true, "Need at least one group with you as member.");
    }
    await firstGroup.click();
    await page.waitForLoadState("networkidle");

    const newEventCta = page.getByRole("link", { name: /new/i }).filter({
      hasText: /new/i,
    });
    if ((await newEventCta.count()) === 0) {
      test.skip(true, "No 'New event' CTA — check upcoming-events section");
    }
    // Use the events/new link specifically
    const eventsLink = page.locator('a[href*="/events/new"]').first();
    if ((await eventsLink.count()) === 0) {
      test.skip(true, "No events/new link visible.");
    }
    await eventsLink.click();
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /^create event$/i }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: /give the event a title/i }),
    ).toBeVisible();
  });
});
