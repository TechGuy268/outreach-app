import { defineConfig } from "prisma/config";

try {
  require("dotenv/config");
} catch {
  // dotenv not needed on Vercel — env vars are injected
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "",
  },
});
