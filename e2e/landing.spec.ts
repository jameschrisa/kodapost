import { test, expect } from "@playwright/test";

test.describe("Landing Page (SplashScreen)", () => {
  test("renders splash screen with key elements", async ({ page }) => {
    await page.goto("/");
    // The splash screen should be visible for unauthenticated users
    // Look for KodaPost branding or main CTA
    await expect(page).toHaveTitle(/KodaPost/i);
  });

  test("has sign-up CTA link", async ({ page }) => {
    await page.goto("/");
    // Look for a sign-up or get-started link/button
    const signUpLink = page.locator('a[href*="sign-up"], button:has-text("Sign Up"), button:has-text("Get Started"), a:has-text("Get Started"), a:has-text("Sign Up")');
    const count = await signUpLink.count();
    // At least one sign-up CTA should exist on the landing page
    expect(count).toBeGreaterThan(0);
  });

  test("has navigation links", async ({ page }) => {
    await page.goto("/");
    // Check for common nav links visible on landing
    const aboutLink = page.locator('a[href*="about"]');
    const aboutCount = await aboutLink.count();
    expect(aboutCount).toBeGreaterThan(0);
  });

  test("landing page loads within reasonable time", async ({ page }) => {
    const start = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - start;
    // Page should load within 10 seconds (generous for dev server)
    expect(loadTime).toBeLessThan(10000);
  });
});
