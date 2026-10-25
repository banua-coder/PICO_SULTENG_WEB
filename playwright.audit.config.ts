import { defineConfig, devices } from '@playwright/test'

// The contrast audit (docs/contrast-audit.md), by hand, against a running build:
//   pnpm build && pnpm exec tsx scripts/serve-dist.ts 4173 &
//   AUDIT_LABEL=after pnpm exec playwright test -c playwright.audit.config.ts && pnpm exec tsx scripts/contrast-report.ts after
export default defineConfig({
  testDir: 'e2e/audit',
  testMatch: /contrast-audit\.ts/,
  fullyParallel: true,
  workers: 6,
  reporter: 'list',
  use: { baseURL: process.env.AUDIT_URL ?? 'http://localhost:4173', ...devices['Desktop Chrome'] },
})
