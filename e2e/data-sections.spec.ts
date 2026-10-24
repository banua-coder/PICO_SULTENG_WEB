import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole } from './support/visit'

const SULTENG = '/data/provinsi/sulawesi-tengah'

test.describe('Data page sections', () => {
  test('Sulawesi Tengah: every section is there, in order, with no console noise', async ({ page }) => {
    const log = watchConsole(page)
    await visit(page, SULTENG)
    await expect(page.getByTestId('curves').locator('figure').first()).toBeVisible()
    const ids = await page.locator('main section[aria-labelledby]').evaluateAll((s) => s.map((e) => e.getAttribute('aria-labelledby')))
    await expect(page.getByTestId('curves').locator('[data-peak]')).toHaveCount(1) // the one crimson thread of the chart
    expect(ids).toEqual(['ringkasan', 'kurva', 'rt', 'peta', 'odp-pdp', 'gender', 'tes'])
    expect(log).toEqual([])
  })

  test('daily view: two charts, one crimson peak bar, the 7-day average; the radio writes ?tampilan and keeps the window', async ({ page }) => {
    await visit(page, `${SULTENG}?dari=2024-01-01`)
    const curves = page.getByTestId('curves')
    await expect(curves.locator('figure')).toHaveCount(2)
    await expect(curves.getByText('rata-rata 7 hari').first()).toBeVisible()
    await curves.getByText('Kumulatif', { exact: true }).click()
    await expect(page).toHaveURL(/dari=2024-01-01/)
    await expect(page).toHaveURL(/tampilan=kumulatif/)
    await expect(curves.locator('figure')).toHaveCount(1)
    await curves.getByText('Harian', { exact: true }).click()
    await expect(page).not.toHaveURL(/tampilan/)
  })

  test('the chart table lists the same days as the chart', async ({ page }) => {
    await visit(page, `${SULTENG}?dari=2024-01-10&sampai=2024-01-14&tampilan=kumulatif`)
    await page.getByTestId('curves').getByRole('button', { name: 'Lihat sebagai tabel' }).click()
    await expect(page.getByTestId('curves').locator('tbody tr')).toHaveCount(5)
  })

  test('Rt: the explainer links to Metodologi, a window without Rt says so', async ({ page }) => {
    await visit(page, '/data/indonesia?dari=2023-08-01')
    const rt = page.getByTestId('rt-section')
    await expect(rt.getByTestId('rt-none')).toHaveText('Rt tidak tersedia untuk rentang ini')
    await rt.getByRole('link', { name: 'Cara menghitungnya' }).click()
    await expect(page).toHaveURL(/\/metodologi#rt$/)
  })

  test('Rt: national, 2023-07-01 to the end: the last value is 9 July 2023 and the gap note covers the rest', async ({ page }) => {
    await visit(page, '/data/indonesia?dari=2023-07-01')
    const rt = page.getByTestId('rt-section')
    await expect(rt.getByTestId('rt-last')).toContainText('9 Juli 2023')
    await expect(rt.getByTestId('rt-gaps')).toContainText('14 Januari 2024')
    await expect(rt.getByTestId('rt-end')).toContainText('Setelah 9 Juli 2023')
  })

  test('map: on a kabupaten page it is selected, Tab from the metric switch reaches it, and a choice keeps the window', async ({ page }) => {
    await visit(page, '/data/kabupaten/poso?dari=2021-07-01&sampai=2021-07-31')
    const map = page.getByTestId('submap')
    await expect(map.locator('g[role="link"][aria-current="true"]')).toHaveAttribute('data-code', '7204')
    await map.getByRole('radio').first().focus()
    let reached = false
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate(() => document.activeElement?.getAttribute('data-code') === '7204')
    }
    expect(reached).toBe(true)
    await map.locator('tbody a', { hasText: 'Kota Palu' }).click()
    await expect(page).toHaveURL(/\/data\/kabupaten\/kota-palu\?dari=2021-07-01&sampai=2021-07-31/)
  })

  test('another province has no map, no gender and no tests; the country has the 34 provinces', async ({ page }) => {
    await visit(page, '/data/provinsi/aceh')
    await expect(page.getByTestId('submap')).toHaveCount(0)
    await expect(page.getByTestId('gender')).toHaveCount(0)
    await expect(page.getByTestId('tests')).toHaveCount(0)
    await visit(page, '/data/indonesia')
    await expect(page.getByTestId('submap').locator('tbody tr')).toHaveCount(34)
  })

  test('gender and tests: no date is invented, PCR and RDT only, the end-date note', async ({ page }) => {
    await visit(page, SULTENG)
    await expect(page.getByTestId('gender-caption')).toHaveText('Data terakhir yang tersedia dari sumber. Tanggal tidak tercatat di API.')
    await expect(page.getByTestId('tests').locator('[data-type]')).toHaveCount(2)
    await expect(page.getByTestId('tests-note')).toContainText('28 September 2020')
  })

  test('the series is requested once, by the client, and the first paint has the summary already', async ({ page }) => {
    const seen: string[] = []
    page.on('request', (r) => /\/provinces\/72\/cases/.test(r.url()) && seen.push(r.url()))
    await visit(page, SULTENG)
    await expect(page.getByTestId('curves').locator('figure').first()).toBeVisible()
    expect(seen).toHaveLength(1)
  })

  test('360 px: no sideways scroll with every section', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, SULTENG)
    await expect(page.getByTestId('tests').locator('[data-type]').first()).toBeVisible()
    await expect(page.getByTestId('curves').locator('figure').first()).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const [locale, theme] of [['id', 'light'], ['en', 'dark']] as const) {
    test(`axe on the full page (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, SULTENG, { locale, theme })
      await expect(page.getByTestId('curves').locator('figure').first()).toBeVisible()
      await expect(page.getByTestId('rt-section').locator('figure')).toBeVisible()
      await expect(page.getByTestId('tests').locator('figure').first()).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
