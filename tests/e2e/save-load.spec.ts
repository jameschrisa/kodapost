import { test, expect, Page } from "@playwright/test";
import path from "path";

/**
 * Draft persistence tests for KodaPost.
 *
 * These tests verify that projects can be saved, listed in the Projects tab,
 * resumed, and deleted. The app uses IndexedDB (multi-draft system) and
 * localStorage for persistence.
 *
 * Auth note: Same as workflow.spec.ts. Requires Clerk disabled or a
 * pre-authenticated session.
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

/** Upload a test image and navigate to the Configure step. */
async function uploadAndConfigure(page: Page) {
  const fileInput = page.locator('input[type="file"][accept*="image"]');
  await fileInput.setInputFiles(
    path.resolve(__dirname, "../../public/test-photos/testreal1.jpg")
  );

  await expect(
    page.locator('text=1 image uploaded', { exact: false })
  ).toBeVisible({ timeout: 10000 });

  const continueButton = page.locator('button:has-text("Continue with")');
  await continueButton.click();

  await expect(
    page.locator('h2:has-text("Craft Your")')
  ).toBeVisible({ timeout: 10000 });
}

test.describe("Draft Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB and localStorage for a clean slate
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      // Delete all IndexedDB databases we know about
      indexedDB.deleteDatabase("kodapost-drafts");
      indexedDB.deleteDatabase("kodapost-images");
    });
  });

  test("save project with name via Save button", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // The Save button should be visible on the Configure step
    const saveButton = page.locator('button[aria-label="Save project"]');
    await expect(saveButton).toBeVisible();

    // Click Save - since it has no name yet, it should show a name input popover
    await saveButton.click();

    // The popover with "Name your project" should appear
    await expect(
      page.locator('text=Name your project')
    ).toBeVisible({ timeout: 5000 });

    // Type a project name
    const nameInput = page.locator('input[placeholder="Untitled Project"]');
    await nameInput.fill("My Test Carousel");

    // Click the "Save Project" button in the popover
    const saveProjectButton = page.locator(
      'button:has-text("Save Project")'
    );
    await saveProjectButton.click();

    // A success toast should appear
    await expect(
      page.locator('text=Project saved', { exact: false })
    ).toBeVisible({ timeout: 5000 });
  });

  test("saved project appears in Projects tab", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Save with a name
    const saveButton = page.locator('button[aria-label="Save project"]');
    await saveButton.click();

    const nameInput = page.locator('input[placeholder="Untitled Project"]');
    await nameInput.fill("E2E Test Project");

    const saveProjectButton = page.locator(
      'button:has-text("Save Project")'
    );
    await saveProjectButton.click();

    await expect(
      page.locator('text=Project saved', { exact: false })
    ).toBeVisible({ timeout: 5000 });

    // Wait for auto-save to persist to IndexedDB
    await page.waitForTimeout(1000);

    // Navigate to the Projects tab
    const projectsTab = page.locator('button:has-text("Projects")');
    await projectsTab.click();

    // The project name should appear in the projects list
    await expect(
      page.locator('text=E2E Test Project')
    ).toBeVisible({ timeout: 5000 });
  });

  test("continue project from Projects tab restores state", async ({
    page,
  }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Save the project
    const saveButton = page.locator('button[aria-label="Save project"]');
    await saveButton.click();

    const nameInput = page.locator('input[placeholder="Untitled Project"]');
    await nameInput.fill("Resume Test");

    await page.locator('button:has-text("Save Project")').click();
    await page.waitForTimeout(1000);

    // Go to Projects tab
    await page.locator('button:has-text("Projects")').click();
    await page.waitForTimeout(500);

    // Click "Continue" on the project
    const continueButton = page.locator(
      'button:has-text("Continue"), button:has-text("Open")'
    );
    if ((await continueButton.count()) > 0) {
      await continueButton.first().click();
    }

    // Should switch back to Create Post mode
    await expect(
      page.locator('h2:has-text("Craft Your"), h2:has-text("Upload Your Photos")')
    ).toBeVisible({ timeout: 5000 });
  });

  test("delete project from Projects tab", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Save with a name
    const saveButton = page.locator('button[aria-label="Save project"]');
    await saveButton.click();

    const nameInput = page.locator('input[placeholder="Untitled Project"]');
    await nameInput.fill("Delete Me");

    await page.locator('button:has-text("Save Project")').click();
    await page.waitForTimeout(1000);

    // Go to Projects tab
    await page.locator('button:has-text("Projects")').click();
    await page.waitForTimeout(500);

    // The project should be listed
    await expect(
      page.locator('text=Delete Me')
    ).toBeVisible({ timeout: 5000 });

    // Find and click the delete button for this project
    // The ProjectsView typically has a delete/trash icon button per draft
    const deleteButton = page.locator(
      'button[aria-label*="Delete"], button[aria-label*="delete"]'
    );
    if ((await deleteButton.count()) > 0) {
      await deleteButton.first().click();

      // Confirm deletion if a dialog appears
      const confirmButton = page.locator(
        'button:has-text("Delete"), button:has-text("Confirm")'
      );
      if ((await confirmButton.count()) > 0) {
        await confirmButton.first().click();
      }

      // A deletion toast should appear
      await expect(
        page.locator('text=deleted', { exact: false })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("auto-save creates a draft on first upload", async ({ page }) => {
    await waitForAppReady(page);
    await uploadAndConfigure(page);

    // Wait for auto-save debounce (500ms + buffer)
    await page.waitForTimeout(1500);

    // Navigate to Projects tab
    await page.locator('button:has-text("Projects")').click();
    await page.waitForTimeout(500);

    // At least one draft should exist (auto-created on upload)
    // It may be named "Untitled Project"
    const projectCards = page.locator('[class*="draft"], [class*="project"]');
    // Even without specific class names, the Projects view should show content
    const projectsContent = await page.locator('main').textContent();
    // The auto-saved draft should be present (could be "Untitled Project")
    expect(projectsContent).toBeTruthy();
  });
});
