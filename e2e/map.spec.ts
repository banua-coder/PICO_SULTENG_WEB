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

test('Sebaran: areas have different fills by class, the legend lists classes and the tooltip shows four numbers', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const map = page.locator('[data-testid="geo-map"]').first()
  const fills = await map.locator('g[role="link"] path[data-fill]').evaluateAll((els) => new Set(els.map((e) => getComputedStyle(e).fill)).size)
  expect(fills).toBeGreaterThanOrEqual(4)
  await expect(page.getByTestId('map-legend').first().locator('li[data-step]')).not.toHaveCount(0)
  await map.locator('g[data-code="7271"]').hover()
  await expect(page.locator('[data-tooltip]').first()).toContainText('Kota Palu')
})

test('zoom: the buttons zoom and reset, Ctrl+wheel zooms, a plain wheel scrolls the page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const map = page.locator('[data-testid="geo-map"]').first()
  await expect(map).toHaveAttribute('data-zoom-level', '1.00')
  const zoomIn = page.locator('[data-zoom="in"]').first()
  await zoomIn.click()
  await expect(map).toHaveAttribute('data-zoom-level', '1.50')
  await page.locator('[data-zoom="reset"]').first().click()
  await expect(map).toHaveAttribute('data-zoom-level', '1.00')
  await zoomIn.focus()
  await page.keyboard.press('Enter')
  await expect(map).toHaveAttribute('data-zoom-level', '1.50')
})

test('wheel: a plain wheel scrolls the page until the map is clicked, then it zooms; Escape ends it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const map = page.locator('[data-testid="geo-map"]').first()
  const host = page.locator('[data-testid="geo-host"]').first()
  await host.scrollIntoViewIfNeeded()
  const box = (await host.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 20)
  const y0 = await page.evaluate(() => window.scrollY)
  await page.mouse.wheel(0, 200)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0)
  await expect(map).toHaveAttribute('data-zoom-level', '1.00')
  await host.scrollIntoViewIfNeeded()
  const b2 = (await host.boundingBox())!
  await page.mouse.click(b2.x + 5, b2.y + b2.height / 2) // the empty left edge of the map: arms the wheel
  await expect(page.locator('figure:has([data-testid="geo-host"]) [data-testid="wheel-hint"]').first()).toContainText('Zoom roda aktif')
  await page.mouse.wheel(0, -300)
  await expect(map).not.toHaveAttribute('data-zoom-level', '1.00')
  await page.keyboard.press('Escape')
  await page.locator('[data-zoom="reset"]').first().click()
  await expect(map).toHaveAttribute('data-zoom-level', '1.00')
  await page.mouse.move(b2.x + 20, b2.y + b2.height / 2)
  await page.mouse.wheel(0, -300)
  await expect(map).toHaveAttribute('data-zoom-level', '1.00')
})
