import { test, expect } from "@playwright/test";

test.describe("API Health Checks", () => {
  test("GET /api/health returns health data", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("envVar");
    expect(data).toHaveProperty("nodeVersion");
  });

  test("GET /api/health with serveraction test param", async ({ request }) => {
    const response = await request.get("/api/health?test=serveraction");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("serializationTest");
    expect(data.serializationTest).toBe("OK");
    expect(data).toHaveProperty("payloadSizeBytes");
  });

  test("GET /api/v1/health returns API version info", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.version).toBe("1.0.0");
    expect(data).toHaveProperty("database");
    expect(data).toHaveProperty("timestamp");
  });

  test("health endpoint returns valid JSON content-type", async ({ request }) => {
    const response = await request.get("/api/health");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");
  });
});
