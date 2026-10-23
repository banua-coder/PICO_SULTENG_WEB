import { expect, test } from './support/test'
import { hydrated } from './support/a11y'

test.beforeEach(async ({ page }) => {
  await page.route('https://i.ibb.co/**', (r) => r.abort())
})

const plot = (page: import('@playwright/test').Page) => page.locator('figure [role="group"]').first()

test('keyboard: Tab reaches the plot, arrows and Page keys move through dates, the live region reads the values', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  await plot(page).focus()
  const live = page.getByTestId('chart-live')
  await expect(live).toHaveText(/^14 Januari 2024: positif \d+, sembuh \d+, meninggal \d+, dirawat \d+$/)
  await page.keyboard.press('ArrowLeft')
  await expect(live).toHaveText(/^13 Januari 2024:/)
  await page.keyboard.press('PageUp')
  await expect(live).toHaveText(/^14 Desember 2023:/)
  await page.keyboard.press('Home')
  await expect(live).toHaveText(/^2 Maret 2020:/)
  await page.keyboard.press('End')
  await expect(live).toHaveText(/^14 Januari 2024:/)
  await expect(page.locator('[data-crosshair]')).toBeVisible()
  await expect(page.locator('[data-tooltip]')).toBeVisible()
})

test('the table view shows the same numbers as the plot', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  await plot(page).focus()
  const spoken = await page.getByTestId('chart-live').textContent()
  await page.getByRole('button', { name: 'Lihat sebagai tabel' }).click()
  const row = page.locator('tr', { has: page.locator('th[scope="row"] time[datetime="2024-01-14"]') })
  const cells = (await row.locator('td').allTextContents()).map((t) => t.trim())
  expect(cells).toHaveLength(4)
  const values = [...spoken!.matchAll(/(?:positif|sembuh|meninggal|dirawat) ([\d.]+)/g)].map((m) => m[1])
  expect(cells).toEqual(values)
  await expect(page.getByRole('region', { name: /Contoh grafik harian/ })).toBeVisible()
})

test('a data gap shows as "tidak tersedia" in the table and breaks the active line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const paths = await page.locator('g[data-series="a"] [data-line]').first().getAttribute('d')
  expect((paths!.match(/M/g) ?? []).length).toBeGreaterThan(1)
  await page.getByRole('button', { name: 'Lihat sebagai tabel' }).click()
  await expect(page.locator('td[data-series="a"]', { hasText: 'tidak tersedia' }).first()).toBeVisible()
})

test('4 series x 1,414 points render in under 50 ms with the CPU throttled 4x', async ({ page, context }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/_kit')
  await hydrated(page)
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const ms: number[] = []
  for (let i = 0; i < 7; i++) {
    await page.getByRole('button', { name: 'Render ulang' }).click()
    await expect(page.getByTestId('render-ms')).not.toHaveText('')
    ms.push(parseFloat((await page.getByTestId('render-ms').textContent())!))
    await page.evaluate(() => (document.querySelector('[data-testid="render-ms"]')!.textContent = ''))
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  ms.sort((a, b) => a - b)
  const median = ms[Math.floor(ms.length / 2)]!
  test.info().annotations.push({ type: 'render ms (4x throttle, sorted)', description: ms.join(', ') })
  console.log(`render ms at 4x CPU throttle, sorted: ${ms.join(', ')} (median ${median})`)
  expect(median).toBeLessThan(50)
})

test('no animation runs, with or without reduced motion', async ({ page }) => {
  for (const reducedMotion of ['reduce', 'no-preference'] as const) {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/_kit')
    await hydrated(page)
    await plot(page).focus()
    await page.keyboard.press('ArrowLeft')
    const running = await page.evaluate(() => document.querySelector('figure')!.getAnimations({ subtree: true }).length)
    expect(running).toBe(0)
  }
})

test('narrow screens: bars switch to weekly and nothing overflows', async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 740 })
  await page.goto('/_kit')
  await hydrated(page)
  await page.getByRole('button', { name: 'Batang' }).click()
  const bars = await page.locator('rect[data-bar]').count()
  expect(bars).toBeGreaterThan(0)
  expect(bars).toBeLessThanOrEqual(4 * (Math.ceil(1414 / 7) + 1)) // 4 series, one bar per week each
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0)
})
