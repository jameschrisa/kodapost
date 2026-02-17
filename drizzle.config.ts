import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL || "file:local.db";
const isRemote = url.startsWith("libsql://");

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: isRemote ? "turso" : "sqlite",
  dbCredentials: {
    url,
    ...(isRemote && process.env.TURSO_AUTH_TOKEN
      ? { authToken: process.env.TURSO_AUTH_TOKEN }
      : {}),
  },
});
