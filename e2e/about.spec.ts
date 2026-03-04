import { test, expect } from "@playwright/test";

test.describe("About Page", () => {
  test("renders hero section with branding", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toContainText(/Amplified/i);
  });

  test("displays all major sections", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });

    // Check for key section headings
    await expect(page.locator("text=The Problem")).toBeVisible();
    await expect(page.locator("text=What We Believe")).toBeVisible();
    await expect(page.locator("text=How It Works")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Built by Creators" })).toBeVisible();
  });

  test("shows philosophy section", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator("text=KodaPost Philosophy")).toBeVisible();
    await expect(page.locator("text=You Create.")).toBeVisible();
  });

  test("has contact CTA section", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    await expect(page.locator('a[href="mailto:hello@kodapost.com"]')).toBeVisible();
  });

  test("has link to support page", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const supportLink = page.locator('a[href="/support"]').first();
    await expect(supportLink).toBeVisible();
  });
});
