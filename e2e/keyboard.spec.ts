import { expect, test } from './support/test'
import { toggle, visit } from './support/visit'

// Spec 80 keyboard paths. Already covered where they live: skip link and nav (shell.spec), chart crosshair (chart.spec),
// map selection (map.spec). The infographic viewer and the table pager join this file with their pages (part B).
test('Data toolbar: Tab reaches the area select, the time frames, the year select and the calendar button, in order, and keys operate them', async ({ page }) => {
  await visit(page, '/data/provinsi/sulawesi-tengah')
  await page.getByRole('combobox', { name: 'Pilih provinsi (34)' }).focus()
  const order: string[] = []
  for (let i = 0; i < 4; i++) {
    order.push(await page.evaluate(() => { const e = document.activeElement as HTMLElement; return e.getAttribute('role') === 'combobox' ? `combobox:${(e.getAttribute('aria-label') ?? e.id).slice(0, 4)}` : e.getAttribute('data-testid') ?? (e.textContent ?? '').trim() }))
    await page.keyboard.press('Tab')
  }
  expect(order[0]).toMatch(/^combobox/)
  expect(order[1]).toBe('Semua') // one stop in the time frame group: the pressed item
  expect(order[2]).toMatch(/^combobox/)
  expect(order[3]).toBe('range-trigger')
  // a time frame with the keyboard: arrow to "90 hari", Space
  await toggle(page, 'Semua', 'Rentang waktu').focus()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Space')
  await expect(page).toHaveURL(/dari=2023-09-11/)
  await expect(toggle(page, '90 hari', 'Rentang waktu')).toHaveAttribute('data-state', 'on')
})

test('Data toolbar: the area select changes the page with the keyboard and keeps the window', async ({ page }) => {
  await visit(page, '/data/indonesia?dari=2021-01-01')
  await toggle(page, 'Provinsi', 'Tingkat').click() // the level switch: Nasional, Provinsi, Kabupaten/Kota
  await expect(page).toHaveURL(/\/data\/provinsi\/sulawesi-tengah\?dari=2021-01-01/)
  const select = page.getByRole('combobox', { name: 'Pilih provinsi (34)' })
  await select.focus()
  await page.keyboard.press('Enter')
  await page.getByRole('option', { name: 'Bali', exact: true }).focus()
  await page.keyboard.press('Enter')
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
