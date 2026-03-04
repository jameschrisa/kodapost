import { test, expect } from "@playwright/test";

test.describe("Mobile Viewport Tests", () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X size

  test("landing page loads on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/KodaPost/i);
    // Page should render without crashing on mobile
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("about page renders on mobile", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
  });

  test("legal pages render on mobile", async ({ page }) => {
    await page.goto("/legal/privacy", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Privacy Policy");
  });

  test("sign-up page renders on mobile", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });
});

test.describe("Tablet Viewport Tests", () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test("landing page renders on tablet", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/KodaPost/i);
  });

  test("about page renders on tablet", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toBeVisible();
  });
});
