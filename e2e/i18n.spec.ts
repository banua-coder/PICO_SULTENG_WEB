import { expect, test } from './support/test'

for (const [path, lang, heading] of [
  ['/', 'id', 'Pusat Informasi COVID-19 Sulawesi Tengah'],
  ['/en/', 'en', 'COVID-19 Information Centre of Central Sulawesi'],
] as const) {
  test(`${path} is prerendered in ${lang} and hydrates with no console warning`, async ({ page }) => {
    const logs: string[] = []
    page.on('console', (m) => ['warning', 'error'].includes(m.type()) && !/Failed to load resource/.test(m.text()) && logs.push(m.text())) // third-party images may fail
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
  await expect(page.getByText('Arsip catatan COVID-19')).toBeVisible()
  await page.getByRole('link', { name: 'English' }).click()
  await expect(page).toHaveURL(/\/en\/$/)
  await expect(page.getByText('An archive of COVID-19 records')).toBeVisible()
  await page.getByRole('link', { name: 'Bahasa Indonesia' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Arsip catatan COVID-19')).toBeVisible()
})
