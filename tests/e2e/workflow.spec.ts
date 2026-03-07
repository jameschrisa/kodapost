import { test, expect, Page } from "@playwright/test";
import path from "path";

/**
 * Core workflow smoke tests for KodaPost.
 *
 * These tests exercise the primary user journey:
 *   Upload -> Configure (Craft) -> Generate -> Edit (Design)
 *
 * Auth note: The app uses Clerk for authentication. When Clerk is enabled,
 * unauthenticated users are redirected to /sign-in after dismissing the
 * splash screen. These tests rely on either:
 *   - Clerk being disabled in the test environment (NEXT_PUBLIC_CLERK_DISABLED=true)
 *   - Or a pre-authenticated session via storageState
 *
 * Tests that require real AI API calls are marked test.skip.
 */

/** Wait for the app builder UI to be ready (past splash screen). */
async function waitForAppReady(page: Page) {
  // Navigate to the app
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // If splash screen is showing, try to dismiss it
  const getStartedButton = page.locator(
    'button:has-text("Get Started"), button:has-text("Open App")'
  );
  if ((await getStartedButton.count()) > 0) {
    await getStartedButton.first().click();
    // Wait for the builder UI to appear
    await page.waitForTimeout(1000);
  }

  // Wait for the main app header to be visible (KodaPost branding)
  await expect(
    page.locator('h1:has-text("KodaPost")')
  ).toBeVisible({ timeout: 10000 });
}

test.describe("Core Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any stored state so each test starts fresh
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test("upload step shows upload zone and step indicator", async ({ page }) => {
    await waitForAppReady(page);

    // Step indicator should show "Upload" as the current step
    const stepIndicator = page.locator('[data-tour="step-indicator"]');
    await expect(stepIndicator).toBeVisible();

    // Upload heading should be visible
    await expect(
      page.locator('h2:has-text("Upload Your Photos")')
    ).toBeVisible();

    // The upload drop zone should be present
    const uploadZone = page.locator('[data-tour="upload-zone"]');
    await expect(uploadZone).toBeVisible();

    // Drop zone should contain instructional text
    await expect(
      page.locator('text=Drag & drop images or click to browse')
    ).toBeVisible();
  });

  test("uploading an image transitions to Configure step", async ({ page }) => {
    await waitForAppReady(page);

    // Upload a test image via the hidden file input
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(
      path.resolve(__dirname, "../../public/test-photos/testreal1.jpg")
    );

    // Wait for the image preview to appear
    await expect(
      page.locator('text=1 image uploaded', { exact: false })
    ).toBeVisible({ timeout: 10000 });

    // Click "Continue with 1 image"
    const continueButton = page.locator('button:has-text("Continue with")');
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    // Should now be on the Configure step
    await expect(
      page.locator('h2:has-text("Craft Your")')
    ).toBeVisible({ timeout: 10000 });

    // Step indicator should reflect the Craft step
    const craftStepLabel = page.locator(
      '[data-tour="step-configure"] span:has-text("Craft"), nav[aria-label="Progress"] >> text=Craft'
    );
    // On mobile, the step indicator shows "Step 2 of 5" with "Craft"
    await expect(
      page.locator('text=Craft').first()
    ).toBeVisible();
  });

  test("uploading multiple images shows carousel options", async ({ page }) => {
    await waitForAppReady(page);

    const fileInput = page.locator('input[type="file"][accept*="image"]');

    // Upload multiple test images
    await fileInput.setInputFiles([
      path.resolve(__dirname, "../../public/test-photos/testreal1.jpg"),
      path.resolve(__dirname, "../../public/test-photos/testreal3.jpg"),
    ]);

    // Wait for images to process
    await expect(
      page.locator('text=2 images uploaded', { exact: false })
    ).toBeVisible({ timeout: 10000 });

    // Post Type selector should appear with "Carousel" option
    await expect(
      page.locator('text=Post Type')
    ).toBeVisible();

    await expect(
      page.locator('button:has-text("Carousel")')
    ).toBeVisible();

    // Continue button should mention both images
    await expect(
      page.locator('button:has-text("Continue with 2 images")')
    ).toBeVisible();
  });

  test.skip(
    "generate carousel and land on Edit step",
    async ({ page }) => {
      // SKIPPED: This test requires a real AI API call (OpenAI) which is
      // slow (~10-30s) and requires valid API keys. It would:
      // 1. Upload images
      // 2. Click "Continue" to reach Configure step
      // 3. Enter a theme
      // 4. Click "Generate Carousel"
      // 5. Wait for generation to complete
      // 6. Verify landing on the Edit (Design) step
      //
      // To run this test, set OPENAI_API_KEY in the environment
      // and remove the .skip.
    }
  );

  test("navigate steps via browser back/forward after upload", async ({
    page,
  }) => {
    await waitForAppReady(page);

    // Upload an image
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(
      path.resolve(__dirname, "../../public/test-photos/testreal1.jpg")
    );

    await expect(
      page.locator('text=1 image uploaded', { exact: false })
    ).toBeVisible({ timeout: 10000 });

    // Navigate to Configure step
    const continueButton = page.locator('button:has-text("Continue with")');
    await continueButton.click();

    await expect(
      page.locator('h2:has-text("Craft Your")')
    ).toBeVisible({ timeout: 10000 });

    // URL hash should reflect "configure"
    expect(page.url()).toContain("#configure");

    // Go back via browser history
    await page.goBack();
    await page.waitForTimeout(500);

    // Should return to Upload step
    await expect(
      page.locator('h2:has-text("Upload Your Photos")')
    ).toBeVisible({ timeout: 5000 });

    // Go forward via browser history
    await page.goForward();
    await page.waitForTimeout(500);

    // Should return to Configure step
    await expect(
      page.locator('h2:has-text("Craft Your")')
    ).toBeVisible({ timeout: 5000 });
  });

  test("app mode tabs switch between Create Post and Projects", async ({
    page,
  }) => {
    await waitForAppReady(page);

    // "Create Post" tab should be active by default
    await expect(
      page.locator('button:has-text("Create Post")')
    ).toBeVisible();

    // Click "Projects" tab
    const projectsTab = page.locator('button:has-text("Projects")');
    await expect(projectsTab).toBeVisible();
    await projectsTab.click();

    // Projects view should render (it shows drafts or an empty state)
    await page.waitForTimeout(500);

    // Switch back to "Create Post"
    const createTab = page.locator('button:has-text("Create Post")');
    await createTab.click();

    // Upload heading should reappear
    await expect(
      page.locator('h2:has-text("Upload Your Photos")')
    ).toBeVisible({ timeout: 5000 });
  });
});
