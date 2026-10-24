import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole, watchRequests } from './support/visit'

test.describe('Kontak', () => {
  test('the prerendered HTML already has the notice, the hospitals and the task forces; hydrating makes no API request', async ({ page }) => {
    const html = await (await page.request.get('/kontak')).text()
    expect(html).toContain('arsip dari masa pandemi')
    expect(html).toContain('hubungi 119')
    expect(html).toContain('<article')
    expect(html).toContain('data-todo="kontak-119"')
    const api = watchRequests(page)
    const log = watchConsole(page)
    await visit(page, '/kontak')
    await page.waitForLoadState('networkidle')
    expect(api).toEqual([])
    expect(log).toEqual([])
  })

  test('the kabupaten filter narrows both lists and writes ?kabupaten', async ({ page }) => {
    await visit(page, '/kontak')
    const all = await page.getByRole('article').count()
    await page.getByLabel('Kabupaten/Kota', { exact: true }).selectOption('kota-palu')
    await expect(page).toHaveURL(/kabupaten=kota-palu/)
    const palu = await page.getByRole('article').count()
    expect(palu).toBeGreaterThan(0)
    expect(palu).toBeLessThan(all)
    for (const a of await page.getByRole('article').all()) await expect(a).toContainText('Kota Palu')
    await expect(page.getByRole('heading', { level: 3, name: 'Kota Palu' })).toBeVisible()
    await page.getByLabel('Kabupaten/Kota', { exact: true }).selectOption('')
    await expect(page).not.toHaveURL(/kabupaten=/)
    expect(await page.getByRole('article').count()).toBe(all)
  })

  test('every link in the lists is https, tel or mailto; a map link opens a new tab with noopener', async ({ page }) => {
    await visit(page, '/kontak')
    const hrefs = await page.locator('main a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!))
    expect(hrefs.length).toBeGreaterThan(30)
    for (const h of hrefs) expect(h, h).toMatch(/^(https:|tel:|mailto:|\/|#)/)
    const map = page.locator('a[href^="https://www.openstreetmap.org/"]').first()
    await expect(map).toHaveAttribute('target', '_blank')
    await expect(map).toHaveAttribute('rel', /noopener/)
  })

  test('each hospital is an article with a heading and a captioned bed table', async ({ page }) => {
    await visit(page, '/kontak')
    const first = page.getByRole('article').first()
    await expect(first.getByRole('heading', { level: 3 })).toBeVisible()
    await expect(first.locator('caption')).toContainText('per data terakhir')
  })

  test('360 px: no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/kontak')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const [locale, theme] of [['id', 'light'], ['en', 'dark']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, '/kontak', { locale, theme })
      await expect(page.getByRole('article').first()).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
