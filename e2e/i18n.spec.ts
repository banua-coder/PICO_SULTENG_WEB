import { expect, test } from './support/test'

for (const [path, lang, heading] of [
  ['/', 'id', 'PICO Sulteng'],
  ['/en/', 'en', 'PICO Sulteng'],
] as const) {
  test(`${path} is prerendered in ${lang} and hydrates with no console warning`, async ({ page }) => {
    const logs: string[] = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && logs.push(m.text()))
    page.on('pageerror', (e) => logs.push(e.message))
    await page.goto(path)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible()
    await page.getByRole('button', { name: /^(Tema|Theme)/ }).click() // proves the app hydrated
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(logs).toEqual([])
  })
}

test('the language link swaps the prefix and the text', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('tidak tersedia')).toBeVisible()
  await page.getByRole('link', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en\/$/)
  await expect(page.getByText('not available')).toBeVisible()
  await page.getByRole('link', { name: 'Bahasa Indonesia' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('tidak tersedia')).toBeVisible()
})
