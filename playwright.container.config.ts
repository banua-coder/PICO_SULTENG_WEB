import { defineConfig, devices } from '@playwright/test'

// The CSP and console check against the real nginx container (release workflow, docs/deploy.md):
//   CONTAINER_URL=http://127.0.0.1:8080 pnpm exec playwright test -c playwright.container.config.ts
export default defineConfig({
  testDir: 'e2e',
  testMatch: /container\.spec\.ts/,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: process.env.CONTAINER_URL ?? 'http://127.0.0.1:8080' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } }],
})
