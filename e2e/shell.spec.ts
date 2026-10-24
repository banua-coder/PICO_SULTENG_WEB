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

test('keyboard: the phone bar has Beranda, Data, Kontak and Lainnya; Lainnya opens a sheet with the rest, Escape closes it and returns focus', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  const bar = page.getByRole('navigation', { name: 'Navigasi bawah' })
  await expect(bar.getByRole('link')).toHaveCount(3)
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeHidden() // the top links are for wide screens
  const more = bar.getByRole('button', { name: 'Lainnya' })
  await expect(more).toHaveAttribute('aria-expanded', 'false')
  await more.focus()
  await page.keyboard.press('Enter')
  const sheet = page.getByRole('dialog', { name: 'Menu' })
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole('link', { name: 'Vaksin', exact: true })).toBeVisible()
  await expect(sheet.getByRole('link', { name: 'Metodologi', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
  await expect(more).toBeFocused()
})

test('desktop shows the nav inline with no bottom bar, and marks the current page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/data/provinsi/aceh')
  await expect(page.getByRole('navigation', { name: 'Navigasi bawah' })).toBeHidden()
  const top = page.getByRole('navigation', { name: 'Navigasi utama' })
  await expect(top.getByRole('link', { name: 'Data', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(top.getByRole('link')).toHaveCount(7) // the other 3 are under "Lainnya"
  await top.getByRole('button', { name: 'Lainnya' }).click()
  await expect(top.getByRole('link')).toHaveCount(10)
  await expect(top.getByRole('link', { name: 'Metodologi', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(top.getByRole('link', { name: 'Metodologi', exact: true })).toBeHidden()
})

test('navigating moves focus to the new h1 and announces it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await hydrated(page)
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Kontak', exact: true }).click()
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

// Client navigation by keyboard, on every page of the nav: focus lands on the new h1, a polite live region says its text.
// The logic is in AppLayout (router.afterEach), which App.vue wraps around every route, so content pages are covered too.
test('keyboard navigation to every page moves focus to its h1 and announces it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await hydrated(page)
  const paths = ['/mulai', '/data', '/tabel-data', '/vaksin', '/infografis', '/kontak', '/wiki', '/isoman', '/metodologi', '/']
  for (const path of paths) {
    // links under "Lainnya" are in the page, hidden until the menu opens: focus works once it is open
    if (['/tabel-data', '/infografis', '/metodologi'].includes(path)) await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Lainnya' }).click()
    await page.locator(`header nav[aria-label="Navigasi utama"] a[href="${path}"]`).focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${path === '/' ? '/$' : `${path}$`}`))
    const h1 = page.locator('#konten h1')
    await expect(h1).toBeFocused()
    const text = (await h1.textContent())!.trim()
    await expect(page.getByTestId('route-announcer')).toHaveText(text)
    expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('H1')
  }
  await expect(page.getByTestId('route-announcer').and(page.locator('[aria-live="polite"]'))).toHaveCount(1)
})

test('a query-only change (the pager) does not steal focus or re-announce', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/tabel-data')
  await hydrated(page)
  await expect(page.locator('tbody tr').first()).toBeVisible()
  const announced = await page.getByTestId('route-announcer').textContent()
  const next = page.getByRole('button', { name: 'Berikutnya' })
  await next.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/hal=2/)
  await expect(next).toBeFocused()
  await expect(page.getByTestId('route-announcer')).toHaveText(announced ?? '')
})
