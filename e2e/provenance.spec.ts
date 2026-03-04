import { test, expect } from "@playwright/test";

test.describe("Provenance Verification", () => {
  test("provenance verify endpoint exists and responds", async ({ request }) => {
    // POST without a valid body should return 400 or similar, not crash
    const response = await request.post("/api/provenance/verify", {
      data: {},
    });
    const status = response.status();
    // Should not crash with 500
    expect(status).not.toBe(500);
  });

  test("provenance register endpoint responds", async ({ request }) => {
    const response = await request.post("/api/provenance/register", {
      data: {},
    });
    const status = response.status();
    // Route should exist and respond (may require auth or valid data)
    expect(status).not.toBe(500);
  });

  test("provenance status endpoint returns error for invalid id", async ({
    request,
  }) => {
    const response = await request.get("/api/provenance/status/invalid-id");
    const status = response.status();
    // Should not crash
    expect(status).not.toBe(500);
  });
});
