import { test, expect } from "@playwright/test";

test.describe("Sign Up Flow", () => {
  test("sign-up page renders Clerk component", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    // Clerk renders its own auth UI; we check the page loads without error
    await expect(page).toHaveTitle(/KodaPost/i);
    // Check that the page doesn't show a hard error
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("sign-in page renders Clerk component", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/KodaPost/i);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });
});
