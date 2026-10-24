import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole, watchRequests } from './support/visit'

test.describe('Beranda', () => {
  test('the prerendered HTML has both groups of figures as text, the archive line, 119 and no old hotline', async ({ page }) => {
    const html = await (await page.request.get('/')).text()
    expect(html).toContain('data-testid="headline"')
    expect(html).toMatch(/data-testid="headline"[\s\S]{0,3000}63\.614/)
    expect(html).toContain('9 Desember 2023') // the last day with real counts, not the padded 14 January 2024
    expect(html).toContain('Arsip catatan COVID-19 dari 2 Maret 2020 sampai 14 Januari 2024')
    expect(html).toContain('data-testid="province-list"')
    expect(html).toContain('tel:119')
    expect(html).not.toContain('0811404119')
  })

  test('no API request at all on load (everything is in the initial state), and no console noise', async ({ page }) => {
    const api = watchRequests(page)
    const log = watchConsole(page)
    await visit(page, '/')
    await page.waitForLoadState('networkidle')
    expect(api).toEqual([])
    expect(log).toEqual([])
  })

  test('360 x 740: the h1, the 119 card and the first figure (Positif, Sulawesi Tengah) are above the fold; no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/')
    const bottom = async (loc: ReturnType<typeof page.locator>) => (await loc.boundingBox())!.y + (await loc.boundingBox())!.height
    expect(await bottom(page.locator('h1'))).toBeLessThan(740)
    expect(await bottom(page.getByTestId('call-center'))).toBeLessThan(740)
    const positive = page.locator('[data-testid="headline"] [data-state="positive"]').first()
    expect(await bottom(positive.locator('p.font-display').first())).toBeLessThan(740)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  test('the Rt line, the province filter and the vaccine bars work', async ({ page }) => {
    await visit(page, '/')
    await expect(page.getByTestId('rt-now')).toContainText('Rt terakhir yang dapat dihitung')
    await expect(page.getByTestId('rt-now')).toContainText('9 Juli 2023')
    await page.getByText('Provinsi lain di Indonesia').click() // the 34 provinces are in a collapsed block, after Sulawesi Tengah and its 13 kabupaten
    await page.getByLabel('Cari provinsi').fill('bali')
    await expect(page.getByTestId('province-list').locator('li')).toHaveCount(1)
    await page.getByRole('tab', { name: 'Vaksinasi' }).click()
    await expect(page.getByTestId('vaccine-summary').getByRole('progressbar')).toHaveCount(4)
    await page.getByRole('tab', { name: 'Statistik' }).click()
    await expect(page.getByTestId('kabupaten-list').locator('li')).toHaveCount(13)
  })

  test('the 3 hospitals are the same after a reload (a seed by the day)', async ({ page }) => {
    await visit(page, '/')
    const names = () => page.getByTestId('hospital-teaser').locator('li p.font-semibold').allTextContents()
    const first = await names()
    expect(first).toHaveLength(3)
    await page.reload()
    await expect(page.getByTestId('hospital-teaser').locator('li')).toHaveCount(3)
    expect(await names()).toEqual(first)
  })

  test('banners and infographics show the designed missing-image state, never a broken layout', async ({ page }) => {
    await visit(page, '/')
    await expect(page.getByTestId('banners').locator('li')).toHaveCount(2) // the pandemic banners: their pictures are gone, the title card stays
    const info = page.getByTestId('latest-infographics').locator('li')
    await expect(info).toHaveCount(5)
    await expect(info.first().locator('a')).toHaveAttribute('href', /\/infografis\?id=\d+/)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const [locale, theme] of [['id', 'light'], ['en', 'dark']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, '/', { locale, theme })
      await expect(page.getByTestId('headline')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
