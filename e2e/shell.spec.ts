import { expect, test } from './support/test'
import { hydrated } from './support/a11y'

test.use({ viewport: { width: 360, height: 740 } })

test('no horizontal scroll at 320 px on a content-heavy page', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  for (const p of ['/', '/data/provinsi/daerah-istimewa-yogyakarta', '/en/metodologi']) {
    await page.goto(p)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0)
  }
})

test('keyboard: the skip link is the first Tab stop and moves focus into main', async ({ page }) => {
  await page.goto('/vaksin')
  await hydrated(page)
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Lompat ke konten' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('#konten')).toBeFocused()
})

test('keyboard: the menu opens, Escape closes it and returns focus to its button', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  const menu = page.getByRole('button', { name: 'Menu' })
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('link', { name: 'Kontak', exact: true })).toBeHidden() // collapsed on a narrow screen
  await menu.focus()
  await page.keyboard.press('Enter')
  await expect(menu).toHaveAttribute('aria-expanded', 'true')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Beranda', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-expanded', 'false')
  await expect(menu).toBeFocused()
})

test('desktop shows the nav inline with no Menu button, and marks the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/data/provinsi/aceh')
  await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden()
  await expect(page.getByRole('link', { name: 'Data', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('header nav a')).toHaveCount(9)
})

test('navigating moves focus to the new h1 and announces it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await hydrated(page)
  await page.getByRole('link', { name: 'Kontak', exact: true }).click()
  await expect(page).toHaveURL(/\/kontak$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Kontak' })).toBeFocused()
  await expect(page.getByTestId('route-announcer')).toHaveText('Kontak')
})

test('language switch keeps the page and the query, both ways', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/data/provinsi/aceh?dari=2021-01-01')
  await hydrated(page)
  await page.getByRole('link', { name: /English/ }).click()
  await expect(page).toHaveURL(/\/en\/data\/provinsi\/aceh\?dari=2021-01-01$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.getByRole('link', { name: /Bahasa Indonesia/ }).click()
  await expect(page).toHaveURL(/\/data\/provinsi\/aceh\?dari=2021-01-01$/)
})

test('an unknown province slug shows the not-found page with links back', async ({ page }) => {
  await page.goto('/data/provinsi/atlantis')
  await expect(page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Ke Beranda', exact: true })).toBeVisible()
})

test('footer partners come from the API and the archive notice shows', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Detexi' })).toBeVisible()
  await expect(page.getByText('Arsip: catatan berhenti pada 14 Januari 2024')).toBeVisible()
})
