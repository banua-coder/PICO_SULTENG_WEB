import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  // container.spec.ts runs against a real nginx container only (playwright.container.config.ts)
  testIgnore: /container\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    // all specs at 1280 x 800
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    // the smoke suite again on a narrow phone screen, in Chromium and WebKit (spec 80)
    { name: 'mobile-chromium', testMatch: 'smoke.spec.ts', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 } } },
    { name: 'mobile-webkit', testMatch: 'smoke.spec.ts', use: { ...devices['Desktop Safari'], viewport: { width: 360, height: 740 } } },
  ],
  webServer: {
    // the kit build adds the /_kit test page, which production builds never have.
    // serve-dist routes like nginx will: per-route prerendered HTML, 404.html with status 404
    command: 'VITE_KIT=1 pnpm build && pnpm exec tsx scripts/serve-dist.ts 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
