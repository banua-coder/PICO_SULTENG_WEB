import { expect, test } from './support/test'

test('a saved dark theme is applied before first paint', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pico-theme', 'dark'))
  // read the attribute as soon as the document exists, before the app scripts run
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => ((window as unknown as { __t: string }).__t = document.documentElement.dataset.theme ?? ''))
  })
  await page.goto('/')
  expect(await page.evaluate(() => (window as unknown as { __t: string }).__t)).toBe('dark')
})

test('the theme button cycles and persists', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).not.toHaveAttribute('data-theme', /.+/)
  await page.getByRole('button', { name: /Tema/ }).click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: /Tema/ }).click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('fonts are self-hosted and within budget', async ({ page }) => {
  const fonts: { url: string; bytes: number }[] = []
  page.on('response', async (res) => {
    if (/\.woff2?(\?|$)/.test(res.url())) fonts.push({ url: res.url(), bytes: (await res.body()).length })
  })
  const external: string[] = []
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost') && !r.url().startsWith('https://pico-api.banuacoder.com/')) external.push(r.url())
  })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  expect(external).toEqual([])
  expect(fonts.length).toBeGreaterThan(0)
  const text = fonts.find((f) => f.url.includes('SourceSans3'))
  expect(text?.bytes).toBeLessThanOrEqual(35 * 1024)
  expect(fonts.reduce((n, f) => n + f.bytes, 0)).toBeLessThanOrEqual(70 * 1024)
})
