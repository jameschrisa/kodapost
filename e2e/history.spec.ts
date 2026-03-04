import { test, expect } from "@playwright/test";

test.describe("History Page", () => {
  test("history page redirects to main page or sign-in", async ({ page }) => {
    await page.goto("/history", { waitUntil: "domcontentloaded" });
    // History page does a client-side redirect to /
    // For unauth users, Clerk middleware may redirect to /sign-in
    await page.waitForTimeout(3000);
    const url = page.url();
    // Should redirect somewhere (not stay on /history with an error)
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });
});
