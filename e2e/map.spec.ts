import { expect, test } from './support/test'
import { hydrated } from './support/a11y'

test.beforeEach(async ({ page }) => {
  await page.route('https://i.ibb.co/**', (r) => r.abort())
})

test('Tab reaches every kabupaten in reading order and Enter and Space select', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const areas = page.locator('[data-testid="geo-map"]').first().locator('g[role="link"]')
  await expect(areas).toHaveCount(13)
  await areas.first().focus()
  const seen: string[] = []
  for (let i = 0; i < 13; i++) {
    seen.push((await page.evaluate(() => (document.activeElement as HTMLElement).getAttribute('data-code'))) ?? '')
    await page.keyboard.press('Tab')
  }
  expect(seen[0]).toBe('7271')
  expect(new Set(seen).size).toBe(13)
  const xs = await areas.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().x + e.getBoundingClientRect().width / 2))
  const byCode = new Map((await areas.evaluateAll((els) => els.map((e) => e.getAttribute('data-code')))).map((c, i) => [c, xs[i]!]))
  const seenXs = seen.map((c) => byCode.get(c)!)
  // west to east in tab order (centroids, so allow the bbox centre to differ slightly)
  expect(seenXs.filter((x, i) => i > 0 && x < seenXs[i - 1]! - 120)).toEqual([])

  await page.locator('g[data-code="7203"]').first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('picked')).toHaveText('Terpilih: Morowali')
  await page.locator('g[data-code="7210"]').first().focus()
  await page.keyboard.press('Space')
  await expect(page.getByTestId('picked')).toHaveText('Terpilih: Sigi')
  await expect(page.locator('g[data-code="7210"]').first()).toHaveAttribute('aria-current', 'true')
})

test('the focus ring is visible on a map area', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const a = page.locator('g[data-code="7204"]').first()
  await a.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  const outline = await a.evaluate((e) => getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth)
  expect(outline).toBe('solid 2px')
})

test('map and table agree, and a missing value is "tidak tersedia" on both', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const table = page.getByTestId('area-table').first()
  const poso = (await table.locator('td[data-code="7204"]').textContent())!.trim()
  expect(await page.locator('g[data-code="7204"]').first().getAttribute('aria-label')).toBe(`Poso: ${poso}`)
  expect((await table.locator('td[data-code="7205"]').textContent())!.trim()).toBe('tidak tersedia')
  expect(await page.locator('g[data-code="7205"]').first().getAttribute('aria-label')).toBe('Donggala: tidak tersedia')
  await expect(page.locator('[data-mark-for="7205"]')).toHaveCount(0)
})

test('mobile 360 px: map fits, small areas keep a 44 px target, province map defers to its table', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/_kit')
  await hydrated(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
  const hit = await page.locator('g[data-code="7211"] [data-hit]').first().boundingBox()
  expect(hit!.width).toBeGreaterThanOrEqual(43.5)
  expect(hit!.height).toBeGreaterThanOrEqual(43.5)
  await expect(page.locator('[data-testid="geo-map"]').nth(1).locator('[data-marks]')).toHaveCount(0) // province map: narrow
  await expect(page.locator('[data-testid="geo-map"]').nth(0).locator('[data-marks]')).toHaveCount(1) // kabupaten map keeps marks
})

test('no band pattern is drawn (cultural review pending)', async ({ page }) => {
  await page.goto('/_kit')
  await hydrated(page)
  await expect(page.locator('[data-band]')).toHaveCount(0)
})

test('desktop: the province map uses the full width, so its marks and numbers show', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const prov = page.locator('[data-testid="geo-map"]').nth(1)
  await expect(prov.locator('[data-marks]')).toHaveCount(1)
  expect(await prov.locator('[data-mark-for]').count()).toBe(34)
  const box = await prov.boundingBox()
  expect(box!.width).toBeGreaterThan(800)
})
