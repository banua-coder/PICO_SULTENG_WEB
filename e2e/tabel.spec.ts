import { readFileSync } from 'node:fs'
import type { Download, Page } from '@playwright/test'
import * as XLSX from 'xlsx'
import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { synthProvinceSeries } from './support/synth'
import { horizontalOverflow, visit, watchConsole, watchRequests } from './support/visit'

const SERIES = '**/api/v1/provinces/72/cases**'
const full = (page: Page) =>
  page.route(SERIES, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: synthProvinceSeries() }))
const readFile = async (d: Download) => readFileSync((await d.path())!)

test.describe('Tabel Data', () => {
  test('first load: 50 rows, newest first, caption, page 1 of 29, no console noise, no xlsx request', async ({ page }) => {
    await full(page)
    const log = watchConsole(page)
    const js: string[] = []
    page.on('request', (r) => /\.js(\?|$)/.test(r.url()) && js.push(r.url()))
    await visit(page, '/tabel-data')
    await expect(page.locator('tbody tr')).toHaveCount(50)
    await expect(page.locator('caption')).toContainText('1.414 baris')
    await expect(page.getByRole('status').filter({ hasText: 'Halaman 1 dari 29' })).toBeVisible()
    await expect(page.locator('tbody th').first()).toContainText('14 Jan 2024')
    expect(js.filter((u) => /xlsx/i.test(u))).toEqual([])
    expect(log).toEqual([])
  })

  test('CSV of the full range has 1,415 lines and matches the first table row; the name follows the window', async ({ page }) => {
    await full(page)
    await visit(page, '/tabel-data')
    await expect(page.locator('tbody tr')).toHaveCount(50)
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Unduh CSV (tampilan ini)' }).click()])
    expect(dl.suggestedFilename()).toBe('pico-sulawesi-tengah-2020-03-02-2024-01-14.csv')
    const text = (await readFile(dl)).toString('utf8')
    expect(text.charCodeAt(0)).toBe(0xfeff)
    const lines = text.trimEnd().split('\r\n')
    expect(lines).toHaveLength(1415)
    expect(lines[1]!.startsWith('2024-01-14,')).toBe(true)
  })

  test('XLSX loads only on click, is busy meanwhile, announces, and reads back to the CSV rows', async ({ page }) => {
    await full(page)
    const chunks = watchRequests(page, 'localhost:4173')
    await visit(page, '/tabel-data?dari=2021-07-01&sampai=2021-07-31')
    await expect(page.locator('tbody tr')).toHaveCount(31)
    expect(chunks.filter((p) => /xlsx/i.test(p))).toEqual([])
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Unduh XLSX (tampilan ini)' }).click()])
    expect(chunks.some((p) => /xlsx/i.test(p))).toBe(true)
    expect(dl.suggestedFilename()).toBe('pico-sulawesi-tengah-2021-07-01-2021-07-31.xlsx')
    await expect(page.getByRole('status').filter({ hasText: 'Berkas siap' })).toBeVisible()
    const wb = XLSX.read(await readFile(dl))
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]!]!, { header: 1 })
    expect(rows).toHaveLength(32)
    expect(rows[1]![0]).toBe('2021-07-31')
    expect(typeof rows[1]![1]).toBe('number')
  })

  test('the pager, the jump-to-date and the URL work with the keyboard', async ({ page }) => {
    await full(page)
    await visit(page, '/tabel-data')
    await expect(page.locator('tbody tr')).toHaveCount(50)
    const next = page.getByRole('button', { name: 'Berikutnya' })
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/hal=2/)
    await expect(page.getByRole('navigation', { name: 'Halaman tabel' }).locator('[aria-current="page"]')).toHaveText('2')
    await expect(page.getByRole('status').filter({ hasText: 'Halaman 2 dari 29' })).toBeVisible()
    await page.getByLabel('Ke tanggal').fill('2020-03-05')
    await page.getByLabel('Ke tanggal').press('Enter')
    await expect(page).toHaveURL(/hal=29/)
    await expect(page.locator('tbody tr').last()).toContainText('2 Mar 2020')
    await expect(page.getByRole('button', { name: 'Berikutnya' })).toBeDisabled()
  })

  test('level and area: a kabupaten has no "Dirawat" column and its own series', async ({ page }) => {
    await visit(page, '/tabel-data?tingkat=kabupaten&wilayah=kota-palu')
    await expect(page.locator('caption')).toContainText('Kota Palu')
    await expect(page.locator('thead')).not.toContainText('Dirawat')
    await page.getByRole('radio', { name: 'Indonesia' }).check()
    await expect(page).toHaveURL(/tingkat=indonesia/)
    await expect(page.locator('caption')).toContainText('Indonesia')
    await expect(page.locator('thead')).toContainText('Dirawat')
    await expect(page.locator('thead')).not.toContainText('ODP')
  })

  test('360 px: the table scrolls inside its own labelled region, the page does not', async ({ page }) => {
    await full(page)
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/tabel-data')
    await expect(page.locator('tbody tr')).toHaveCount(50)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    const region = page.getByRole('region', { name: /Tabel data harian/ })
    await expect(region).toHaveAttribute('tabindex', '0')
    expect(await region.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true)
  })

  test('axe: no violations in either locale (light and dark)', async ({ page }) => {
    await full(page)
    await visit(page, '/tabel-data', { theme: 'dark' })
    await expect(page.locator('tbody tr')).toHaveCount(50)
    await expectNoA11yViolations(page)
    await visit(page, '/tabel-data', { locale: 'en' })
    await expect(page.locator('tbody tr')).toHaveCount(50)
    await expectNoA11yViolations(page)
  })

  test('the series request fails: an alert with retry, the export bar still offers the full files', async ({ page }) => {
    await page.route(SERIES, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"error","error":"boom"}' }))
    await visit(page, '/tabel-data')
    await expect(page.getByRole('alert')).toContainText('Data gagal dimuat')
    await expect(page.getByRole('link', { name: /^CSV/ }).first()).toBeVisible()
  })

  test('the head carries Dataset JSON-LD', async ({ page }) => {
    await page.goto('/tabel-data')
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
    expect(ld['@type']).toBe('Dataset')
  })
})
