import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { expectNoConsoleErrors, horizontalOverflow, visit, watchConsole } from './support/visit'

// Every C5 route x id/en x light/dark. The projects in playwright.config.ts run it at 360 x 740 (Chromium and WebKit)
// and at 1280 x 800 (Chromium). Each run: axe (WCAG 2.2 A and AA), one h1, its own title, no console error, no horizontal scroll.
const ROUTES = [
  '/',
  '/mulai',
  '/data',
  '/data/indonesia',
  '/data/provinsi/sulawesi-tengah',
  '/data/provinsi/aceh',
  '/data/kabupaten/kota-palu',
  '/tabel-data',
  '/vaksin',
  '/infografis',
  '/kontak',
  '/wiki',
  '/isoman',
  '/metodologi',
]
const titles = new Map<string, string>()

for (const route of ROUTES) {
  for (const locale of ['id', 'en'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${locale} ${route} ${theme}`, async ({ page }, info) => {
        const log = watchConsole(page)
        const path = await visit(page, route, { locale, theme })
        await expect(page.locator('h1')).toHaveCount(1)
        const title = await page.title()
        expect(title).toMatch(/ · PICO Sulteng$/)
        const key = `${info.project.name}:${locale}:${theme}`
        const clash = [...titles].find(([k, v]) => k.startsWith(key) && v === title && !k.endsWith(`:${route}`))
        expect(clash, `title "${title}" is shared`).toBeUndefined()
        titles.set(`${key}:${route}`, title)
        await page.evaluate(() => document.fonts.ready)
        await expectNoA11yViolations(page)
        expect(await horizontalOverflow(page), `${path} scrolls sideways`).toBe(0)
        expectNoConsoleErrors(log)
      })
    }
  }
}

test('the not-found page also passes', async ({ page }) => {
  const log = watchConsole(page)
  await visit(page, '/tidak-ada')
  await expect(page.locator('h1')).toHaveText('Halaman tidak ditemukan')
  await expectNoA11yViolations(page)
  expect(await horizontalOverflow(page)).toBe(0)
  expectNoConsoleErrors(log)
})
