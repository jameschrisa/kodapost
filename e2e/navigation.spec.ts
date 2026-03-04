import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {
  test("404 page handles unknown routes gracefully", async ({ page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("support page renders", async ({ page }) => {
    await page.goto("/support", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
    expect(body!.length).toBeGreaterThan(0);
  });

  test("guide page renders", async ({ page }) => {
    await page.goto("/guide", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("introduction page renders", async ({ page }) => {
    await page.goto("/introduction", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("quickstart page renders", async ({ page }) => {
    await page.goto("/quickstart", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });
});
