import { test, expect } from "@playwright/test";

test.describe("Legal Pages", () => {
  test("privacy policy page renders", async ({ page }) => {
    await page.goto("/legal/privacy", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Privacy Policy");
  });

  test("privacy policy has key sections", async ({ page }) => {
    await page.goto("/legal/privacy", { waitUntil: "domcontentloaded" });
    // Check that at least some content rendered
    const content = await page.locator("article").textContent();
    expect(content).toContain("Information We Collect");
  });

  test("terms of use page renders", async ({ page }) => {
    await page.goto("/legal/terms", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText("Terms of Use");
  });

  test("terms of use has key sections", async ({ page }) => {
    await page.goto("/legal/terms", { waitUntil: "domcontentloaded" });
    const content = await page.locator("article").textContent();
    expect(content).toContain("Service Description");
    expect(content).toContain("Intellectual Property");
  });

  test("data handling page renders", async ({ page }) => {
    await page.goto("/legal/data", { waitUntil: "domcontentloaded" });
    const body = await page.locator("body").textContent();
    expect(body).not.toContain("Application error");
  });

  test("legal pages have effective date info", async ({ page }) => {
    await page.goto("/legal/privacy", { waitUntil: "domcontentloaded" });
    const content = await page.locator("article").textContent();
    expect(content).toContain("2026");
  });
});
