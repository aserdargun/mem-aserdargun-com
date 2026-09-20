import { defineConfig } from "@playwright/test";
const liveURL = process.env.MEM_BASE_URL;
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 6000 },
  use: {
    baseURL: liveURL || "http://127.0.0.1:8042",
    headless: true,
    viewport: { width: 1440, height: 1000 },
  },
  webServer: liveURL
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:8042",
        reuseExistingServer: false,
        timeout: 15000,
      },
  reporter: "list",
});
