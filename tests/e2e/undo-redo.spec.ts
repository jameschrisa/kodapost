import { test, expect, Page } from "@playwright/test";
import path from "path";

/**
 * Undo/redo tests for KodaPost.
 *
 * The app supports Cmd+Z (undo) and Cmd+Shift+Z (redo) via the
 * useKeyboardShortcuts hook, backed by useUndoRedo which maintains
 * a stack of CarouselProject snapshots.
 *
 * Undo/redo is active on the Configure and Edit steps. Changes are
 * debounced (300ms) before being pushed to the undo stack.
 *
 * Auth note: Same as workflow.spec.ts.
 */

/** Wait for the app builder UI to be ready (past splash screen). */
async function waitForAppReady(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const getStartedButton = page.locator(
    'button:has-text("Get Started"), button:has-text("Open App")'
  );
  if ((await getStartedButton.count()) > 0) {
    await getStartedButton.first().click();
    await page.waitForTimeout(1000);
  }

  await expect(
    page.locator('h1:has-text("KodaPost")')
  ).toBeVisible({ timeout: 10000 });
}

/** Upload an image and navigate to the Configure step. */
async function uploadAndConfigure(page: Page) {
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles(
    path.resolve(__dirname, "../../public/test-photos/testreal1.jpg")
  );

  await expect(
    page.locator('text=1 image uploaded', { exact: false })
  ).toBeVisible({ timeout: 10000 });

  await page.locator('button:has-text("Continue with")').click();

  await expect(
    page.locator('h2:has-text("Craft Your")')
  ).toBeVisible({ timeout: 10000 });
}

test.describe("Undo / Redo", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("Cmd+Z triggers undo toast on Configure step", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Type a theme to create a state change
    const themeInput = page.locator(
      'input[placeholder*="theme"], input[placeholder*="Theme"], textarea[placeholder*="theme"], textarea[placeholder*="Theme"], input[name="theme"]'
    );

    // The theme input might be labeled differently - find it by the card heading
    const storyCard = page.locator('[data-tour="tour-story-card"]');
    const inputInCard = storyCard.locator("input, textarea").first();

    if ((await inputInCard.count()) > 0) {
      await inputInCard.fill("Vintage summer vibes");

      // Wait for the debounced undo push (300ms + buffer)
      await page.waitForTimeout(500);

      // Clear the field to create another state
      await inputInCard.fill("");
      await page.waitForTimeout(500);

      // Press Cmd+Z (or Ctrl+Z on non-Mac)
      const modifier = process.platform === "darwin" ? "Meta" : "Control";
      await page.keyboard.press(`${modifier}+z`);

      // Should show an "Undone" toast
      await expect(
        page.locator('text=Undone')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test("Cmd+Shift+Z triggers redo toast after undo", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Make a change
    const storyCard = page.locator('[data-tour="tour-story-card"]');
    const inputInCard = storyCard.locator("input, textarea").first();

    if ((await inputInCard.count()) > 0) {
      await inputInCard.fill("Test theme");
      await page.waitForTimeout(500);

      await inputInCard.fill("Changed theme");
      await page.waitForTimeout(500);

      const modifier = process.platform === "darwin" ? "Meta" : "Control";

      // Undo
      await page.keyboard.press(`${modifier}+z`);
      await expect(
        page.locator('text=Undone')
      ).toBeVisible({ timeout: 3000 });

      // Wait for toast to clear
      await page.waitForTimeout(2000);

      // Redo
      await page.keyboard.press(`${modifier}+Shift+z`);
      await expect(
        page.locator('text=Redone')
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test("Cmd+S triggers save on Configure step", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+s`);

    // Should show a "Project saved" toast
    await expect(
      page.locator('text=Project saved', { exact: false })
    ).toBeVisible({ timeout: 5000 });
  });

  test("Escape key navigates back from Configure to Upload", async ({
    page,
  }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Press Escape
    await page.keyboard.press("Escape");

    // Should go back to Upload step
    await expect(
      page.locator('h2:has-text("Upload Your Photos")')
    ).toBeVisible({ timeout: 5000 });
  });
});
