import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole, watchRequests } from './support/visit'

test.describe('Metodologi', () => {
  test('the prerendered HTML holds the method, the credit, and the download sizes; hydrating makes no API request', async ({ page }) => {
    const html = await (await page.request.get('/metodologi')).text()
    for (const s of ['EpiEstim', 'm.andrafarm.com', 'Tobungku', 'positive_daily', '/unduh/provinsi.csv']) expect(html, s).toContain(s)
    expect(html).toMatch(/unduh\/provinsi\.csv[\s\S]{0,120}MB\)/)
    const api = watchRequests(page)
    const log = watchConsole(page)
    await visit(page, '/metodologi')
    await page.waitForLoadState('networkidle')
    expect(api).toEqual([])
    expect(log).toEqual([])
  })

  test('/metodologi#rt lands on the Rt section', async ({ page }) => {
    await visit(page, '/metodologi#rt')
    await expect(page.locator('#rt')).toBeInViewport()
  })

  test('360 px: no sideways scroll, the columns table scrolls inside its own region', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/metodologi')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    await expect(page.getByRole('region', { name: 'Kolom berkas unduhan' })).toHaveAttribute('tabindex', '0')
  })

  for (const [locale, theme] of [['id', 'dark'], ['en', 'light']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, '/metodologi', { locale, theme })
      await expect(page.locator('article h2')).toHaveCount(7)
      await expectNoA11yViolations(page)
    })
  }
})
