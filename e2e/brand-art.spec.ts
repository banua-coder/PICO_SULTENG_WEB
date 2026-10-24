import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { visit } from './support/visit'

// Brand v2 art on Wiki, Kontak and Isoman: axe in both themes at both widths, the pictures are plain files, and nothing breaks the CSP.
for (const [path, h1] of [['/wiki', /Wiki|COVID/], ['/kontak', /Kontak/], ['/isoman', /Isolasi|Isoman/]] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const width of [360, 1280]) {
      test(`${path}: axe, ${theme}, ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        const csp: string[] = []
        page.on('console', (m) => /Content Security Policy|Refused to/.test(m.text()) && csp.push(m.text()))
        await visit(page, path, { theme })
        await expect(page.getByRole('heading', { level: 1 })).toContainText(h1)
        await expect(page.locator('.pico-ill img').first()).toBeAttached()
        await expectNoA11yViolations(page)
        expect(csp).toEqual([])
      })
    }
  }
}

test('reduced motion: the success Lottie never loads, the poster stays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const files: string[] = []
  page.on('request', (r) => /\/lottie\/[a-z-]+\.json$|lottie_light/.test(r.url()) && files.push(r.url()))
  await visit(page, '/isoman')
  await page.waitForTimeout(500)
  expect(files).toEqual([])
})
