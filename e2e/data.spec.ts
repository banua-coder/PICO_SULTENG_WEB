import { expect, test } from './support/test'
import { expectNoA11yViolations, hydrated } from './support/a11y'

test('the prerendered HTML of an area route already has its latest cumulative positive as text', async ({ page }) => {
  const html = await (await page.request.get('/data/provinsi/aceh')).text()
  expect(html.includes('<title>Data COVID-19 Aceh · PICO Sulteng</title>')).toBe(true)
  expect(/45\.092/.test(html)).toBe(true)
  const kab = await (await page.request.get('/data/kabupaten/kota-palu')).text()
  expect(/data-testid="summary"/.test(kab)).toBe(true)
  expect((await (await page.request.get('/en/data/indonesia')).text()).includes('<html lang="en"')).toBe(true)
  const res = await page.request.get('/data/provinsi/atlantis')
  expect(res.status()).toBe(404) // unknown slug: 404.html with status 404
})

test('hydrating makes no request for the prerendered resources, and no console warning', async ({ page }) => {
  const api: string[] = []
  const logs: string[] = []
  page.on('request', (r) => r.url().includes('pico-api.banuacoder.com') && api.push(new URL(r.url()).pathname + new URL(r.url()).search))
  page.on('console', (m) => ['warning', 'error'].includes(m.type()) && logs.push(m.text()))
  await page.goto('/data/provinsi/sulawesi-tengah')
  await hydrated(page)
  await page.waitForLoadState('networkidle')
  // the series is not prerendered (0.4 to 0.9 MB), everything small is
  expect(api.filter((p) => !p.includes('/cases'))).toEqual([])
  expect(logs.map((l) => l.slice(0, 200))).toEqual([])
})

test('every route hydrates with no console warning (both locales)', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (m) => ['warning', 'error'].includes(m.type()) && !/Failed to load resource/.test(m.text()) && logs.push(`${page.url()} ${m.text()}`))
  for (const p of ['/', '/en/', '/data', '/en/data/indonesia', '/data/kabupaten/poso', '/tabel-data', '/vaksin', '/kontak', '/en/wiki', '/metodologi', '/zzz']) {
    await page.goto(p)
    await hydrated(page)
  }
  expect(logs).toEqual([])
})

test('the head has canonical, hreflang, Open Graph and JSON-LD on a data page', async ({ page }) => {
  await page.goto('/data')
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe('https://pico.banuacoder.com/data/provinsi/sulawesi-tengah')
  expect(await page.locator('link[hreflang="en"]').getAttribute('href')).toBe('https://pico.banuacoder.com/en/data')
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toBe('https://pico.banuacoder.com/og-image-1200x630.png')
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
  expect(ld['@type']).toBe('Dataset')
  expect(ld.temporalCoverage).toBe('2020-03-02/2024-01-14')
})

test('a custom window shows the figures of its last day, the ODP/PDP note shows 8 Mei 2022, and changes use replace', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31')
  await hydrated(page)
  await expect(page.getByTestId('summary')).toContainText('31 Juli 2021')
  await expect(page.getByTestId('odp-note')).toContainText('8 Mei 2022')
  const start = await page.evaluate(() => history.length)
  for (const name of ['2020', '2021', '2022']) await page.getByRole('button', { name, exact: true }).click()
  await expect(page).toHaveURL(/dari=2022-01-01/)
  await expect(page).toHaveURL(/sampai=2022-12-31/)
  expect(await page.evaluate(() => history.length)).toBe(start) // replace, not push
  await page.getByRole('button', { name: 'Semua' }).click()
  await expect(page).toHaveURL(/\/data\/provinsi\/sulawesi-tengah$/) // defaults leave the URL
})

test('?dari=1999-01-01 clamps and ?dari=abc falls back, with no error', async ({ page }) => {
  await page.goto('/data/provinsi/sulawesi-tengah?dari=1999-01-01')
  await hydrated(page)
  await expect(page.locator('input[type="date"]').first()).toHaveValue('2020-03-02')
  await page.goto('/data/provinsi/sulawesi-tengah?dari=abc')
  await hydrated(page)
  await expect(page.locator('input[type="date"]').first()).toHaveValue('2020-03-02')
})

test('changing the area keeps dari, sampai and tampilan', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/data/provinsi/aceh?dari=2021-07-01&sampai=2021-07-31&tampilan=kumulatif')
  await hydrated(page)
  await page.getByLabel('Wilayah').selectOption('kabupaten:kota-palu')
  await expect(page).toHaveURL(/\/data\/kabupaten\/kota-palu\?(?=.*dari=2021-07-01)(?=.*sampai=2021-07-31)(?=.*tampilan=kumulatif)/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data Kota Palu')
})

test('the share block copies the address of the current view', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/data/provinsi/aceh?dari=2021-07-01')
  await hydrated(page)
  await page.getByRole('button', { name: /Salin tautan/ }).click()
  await expect(page.getByTestId('share').getByRole('status')).toHaveText('Disalin')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://pico.banuacoder.com/data/provinsi/aceh?dari=2021-07-01')
})

test('Data page passes axe in both locales and themes at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const [path, theme] of [['/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31', 'light'], ['/en/data/kabupaten/poso', 'dark']] as const) {
    await page.addInitScript((t) => localStorage.setItem('pico-theme', t), theme)
    await page.goto(path)
    await hydrated(page)
    await expect(page.getByTestId('summary')).toBeVisible()
    await expectNoA11yViolations(page)
  }
})
