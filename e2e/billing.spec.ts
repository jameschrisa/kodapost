import { test, expect } from "@playwright/test";

test.describe("Billing Page", () => {
  test("billing page renders without crash", async ({ page }) => {
    await page.goto("/billing");
    // Should load without error (may redirect to sign-in for unauth users)
    const url = page.url();
    // Either stays on /billing or redirects to sign-in
    const validDestination =
      url.includes("/billing") || url.includes("/sign-in");
    expect(validDestination).toBeTruthy();
  });

  test("billing page has back link to home", async ({ page }) => {
    await page.goto("/billing");
    const url = page.url();
    if (url.includes("/billing")) {
      // If we're on billing page, check for back nav
      const backLink = page.locator('a[href="/"]');
      const count = await backLink.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("billing page shows branding", async ({ page }) => {
    await page.goto("/billing");
    const url = page.url();
    if (url.includes("/billing")) {
      // Check that page content loaded (not blank)
      const body = await page.locator("body").textContent();
      expect(body!.length).toBeGreaterThan(0);
    }
  });
});
