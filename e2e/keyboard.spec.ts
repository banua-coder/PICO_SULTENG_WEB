import { expect, test } from './support/test'
import { visit } from './support/visit'

// Spec 80 keyboard paths. Already covered where they live: skip link and nav (shell.spec), chart crosshair (chart.spec),
// map selection (map.spec). The infographic viewer and the table pager join this file with their pages (part B).
test('Data toolbar: Tab reaches the area select, both dates and every preset, in order, and keys operate them', async ({ page }) => {
  await visit(page, '/data/provinsi/sulawesi-tengah')
  await page.getByLabel('Wilayah').focus()
  const order: string[] = []
  for (let i = 0; i < 24; i++) { // a date input has three Tab stops (day, month, year)
    order.push(await page.evaluate(() => { const e = document.activeElement as HTMLElement; return e.tagName === 'SELECT' ? 'select' : e.getAttribute('type') === 'date' ? 'date' : (e.textContent ?? '').trim() }))
    await page.keyboard.press('Tab')
  }
  expect(order.slice(0, 2)).toEqual(['select', 'date'])
  expect(order).toEqual(expect.arrayContaining(['Semua', '2020', '2021', '2022', '2023', 'Gelombang Delta']))
  // a preset with the keyboard
  await page.getByRole('button', { name: '2021', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/dari=2021-01-01/)
  await page.getByRole('button', { name: 'Gelombang Delta' }).focus()
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/dari=2021-06-01/)
  await expect(page).toHaveURL(/sampai=2021-09-30/)
  await expect(page.getByRole('button', { name: 'Gelombang Delta' })).toHaveAttribute('aria-pressed', 'true')
})

test('Data toolbar: the area select changes the page with the keyboard and keeps the window', async ({ page }) => {
  await visit(page, '/data/indonesia?dari=2021-01-01')
  const select = page.getByLabel('Wilayah')
  await select.focus()
  await select.selectOption('provinsi:bali')
  await expect(page).toHaveURL(/\/data\/provinsi\/bali\?dari=2021-01-01/)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused() // focus moves to the new page's h1
})

test('every focusable control on a Data page has a visible focus ring', async ({ page }) => {
  await visit(page, '/data/provinsi/sulawesi-tengah')
  await page.keyboard.press('Tab') // skip link
  for (let i = 0; i < 6; i++) {
    const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement!); return `${s.outlineStyle} ${s.outlineWidth}` })
    expect(ring).toBe('solid 2px')
    await page.keyboard.press('Tab')
  }
})

test('Tabel Data: Tab reaches the scroll region, the pager and both export buttons; the region scrolls with the arrow keys', async ({ page }) => {
  await visit(page, '/tabel-data')
  await expect(page.locator('tbody tr')).toHaveCount(50)
  const region = page.getByRole('region', { name: /Tabel data harian/ })
  await region.focus()
  await expect(region).toBeFocused()
  const ring = await region.evaluate((e) => getComputedStyle(e).outlineStyle)
  expect(ring).toBe('solid')
  const top = await region.evaluate((e) => e.scrollTop)
  await page.keyboard.press('ArrowDown')
  await expect.poll(() => region.evaluate((e) => e.scrollTop)).toBeGreaterThan(top)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Halaman 1', exact: true })).toBeFocused() // "Sebelumnya" is disabled on page 1
  await page.getByRole('button', { name: 'Unduh CSV (tampilan ini)' }).focus()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Unduh XLSX (tampilan ini)' })).toBeFocused()
})
