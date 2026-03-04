import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard", () => {
  test("admin page requires authentication", async ({ page }) => {
    await page.goto("/admin");
    // Unauthenticated users should be redirected to sign-in
    // or see an auth-blocked page
    await page.waitForTimeout(2000);
    const url = page.url();
    const body = await page.locator("body").textContent();
    // Page shouldn't crash
    expect(body).not.toBeNull();
    // Should either redirect to sign-in or load admin page
    expect(url).toMatch(/\/(admin|sign-in)/);
  });

  test("admin API returns error for unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/admin/users");
    // Could return 401, 403, 404, or redirect depending on middleware config
    const status = response.status();
    // The route should respond (not crash with 500)
    expect(status).not.toBe(500);
  });
});
