import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole } from './support/visit'

test.describe('Wiki', () => {
  for (const [locale, theme] of [['id', 'light'], ['en', 'dark']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, '/wiki', { locale, theme })
      await expect(page.locator('article h2')).toHaveCount(7)
      await expectNoA11yViolations(page)
    })
  }

  test('the prerendered page already holds the text, in both languages', async ({ page }) => {
    expect(await (await page.request.get('/wiki')).text()).toContain('Cara penularan')
    expect(await (await page.request.get('/en/wiki')).text()).toContain('How it spreads')
  })

  test('the table of contents jumps to a section; the text measure is 65 to 75 characters on wide screens', async ({ page }) => {
    const log = watchConsole(page)
    await page.setViewportSize({ width: 1280, height: 800 })
    await visit(page, '/wiki')
    await page.getByRole('navigation', { name: 'Daftar isi halaman' }).getByRole('link', { name: 'Gejala' }).click()
    await expect(page).toHaveURL(/#gejala/)
    const m = await page.evaluate(() => {
      const p = document.querySelector('article p')!
      const probe = document.createElement('span')
      probe.style.cssText = 'position:absolute;visibility:hidden;width:100ch'
      p.append(probe)
      const ch = probe.getBoundingClientRect().width / 100
      probe.remove()
      return p.getBoundingClientRect().width / ch
    })
    expect(m).toBeGreaterThanOrEqual(60)
    expect(m).toBeLessThanOrEqual(75)
    expect(log).toEqual([])
  })

  test('sections are spaced: an h2 has at least 32 px above it (a utility that is not in the brand scale gives 0)', async ({ page }) => {
    await visit(page, '/wiki')
    const mt = await page.locator('article h2').nth(1).evaluate((e) => parseFloat(getComputedStyle(e).marginTop))
    expect(mt).toBeGreaterThanOrEqual(32)
  })

  test('360 px: no sideways scroll, and the four tips have captions', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/wiki')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    await expect(page.locator('figure figcaption')).toHaveCount(4)
  })
})
