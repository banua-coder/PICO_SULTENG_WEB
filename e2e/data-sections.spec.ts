import { expect, test } from './support/test'
import { expectNoA11yViolations, hydrated } from './support/a11y'
import { horizontalOverflow, visit, watchConsole } from './support/visit'

const SULTENG = '/data/provinsi/sulawesi-tengah'

test.describe('Data page sections', () => {
  test('Sulawesi Tengah: every section is there, in order, with no console noise', async ({ page }) => {
    const log = watchConsole(page)
    await visit(page, SULTENG)
    await expect(page.getByTestId('curves').locator('figure').first()).toBeVisible()
    const ids = await page.locator('main section[aria-labelledby]').evaluateAll((s) => s.map((e) => e.getAttribute('aria-labelledby')))
    await expect(page.getByTestId('curves').locator('[data-peak]')).toHaveCount(1) // the one ink-coloured peak bar of the chart
    expect(ids).toEqual(['ringkasan', 'tes', 'peta', 'kurva', 'rt', 'kasus-baru', 'odp-pdp', 'gender', 'akses-data']) // the order of the old data page: cards, tests, map, charts, Rt, gender and age, public data
    expect(log).toEqual([])
  })

  test('daily view: one chart for the chosen case type, one peak bar, the 7-day average; the tabs write ?tampilan and keep the window', async ({ page }) => {
    await visit(page, `${SULTENG}?dari=2023-12-01`)
    const curves = page.getByTestId('curves')
    await expect(curves.locator('figure')).toHaveCount(1)
    await expect(curves.getByText('rata-rata 7 hari').first()).toBeVisible()
    await expect(curves.getByTestId('legend')).toBeVisible()
    await curves.getByRole('tab', { name: 'Kumulatif' }).click()
    await expect(page).toHaveURL(/dari=2023-12-01/)
    await expect(page).toHaveURL(/tampilan=kumulatif/)
    await expect(curves.locator('figure')).toHaveCount(1)
    await curves.getByRole('tab', { name: 'Harian' }).click()
    await expect(page).not.toHaveURL(/tampilan/)
  })

  test('the chart table lists the same days as the chart', async ({ page }) => {
    await visit(page, `${SULTENG}?dari=2023-12-05&sampai=2023-12-09&tampilan=kumulatif`)
    await page.getByTestId('curves').getByRole('button', { name: 'Lihat sebagai tabel' }).click()
    await expect(page.getByTestId('curves').locator('tbody tr')).toHaveCount(5)
  })

  test('Rt: the explainer links to Metodologi, a window without Rt says so', async ({ page }) => {
    await visit(page, '/data/indonesia?dari=2020-03-02&sampai=2020-03-08')
    const rt = page.getByTestId('rt-section')
    await expect(rt.getByTestId('rt-none')).toHaveText('Rt tidak tersedia untuk rentang ini')
    await rt.getByRole('link', { name: 'Cara menghitungnya' }).click()
    await expect(page).toHaveURL(/\/metodologi#rt$/)
  })

  test('Rt: national at the default end: the chart runs to its last value, 9 July 2023, and the note says the estimate stopped', async ({ page }) => {
    await visit(page, '/data/indonesia')
    const rt = page.getByTestId('rt-section')
    await expect(rt.getByTestId('rt-last')).toContainText('9 Juli 2023')
    await expect(rt.getByTestId('rt-gaps')).not.toContainText('2024') // the padded end of the record is not a gap
    await expect(rt.getByTestId('rt-end')).toContainText('Setelah 9 Juli 2023')
  })

  test('map: on a kabupaten page it is selected, Tab from the metric switch reaches it, and a choice keeps the window', async ({ page }) => {
    await visit(page, '/data/kabupaten/poso?dari=2021-07-01&sampai=2021-07-31')
    const map = page.getByTestId('submap')
    await expect(map.locator('g[role="link"][aria-current="true"]')).toHaveAttribute('data-code', '7204')
    await map.locator('[data-slot="toggle-group-item"]').first().focus()
    let reached = false
    for (let i = 0; i < 40 && !reached; i++) {
      await page.keyboard.press('Tab')
      reached = await page.evaluate(() => document.activeElement?.getAttribute('data-code') === '7204')
    }
    expect(reached).toBe(true)
    await map.locator('tbody a', { hasText: 'Kota Palu' }).click()
    await expect(page).toHaveURL(/\/data\/kabupaten\/kota-palu\?dari=2021-07-01&sampai=2021-07-31/)
  })

  test('another province has the province map with itself selected, but no gender and no tests; the country has the 34 provinces', async ({ page }) => {
    await visit(page, '/data/provinsi/aceh')
    await expect(page.getByTestId('submap').locator('g[role="link"][aria-current="true"]')).toHaveAttribute('data-code', '11')
    await expect(page.getByTestId('submap').locator('table')).toHaveCount(1)
    await expect(page.getByTestId('gender')).toHaveCount(0)
    await expect(page.getByTestId('tests')).toHaveCount(0)
    await visit(page, '/data/indonesia')
    await expect(page.getByTestId('submap').locator('tbody tr')).toHaveCount(34)
  })

  test('gender and tests: no date is invented, PCR and RDT only, the end-date note', async ({ page }) => {
    await visit(page, SULTENG)
    await expect(page.getByTestId('gender-caption')).toHaveText('Data terakhir yang tersedia dari sumber. Tanggal tidak tercatat di API.')
    await expect(page.getByTestId('tests').locator('[data-type]')).toHaveCount(2)
    await expect(page.getByTestId('tests-note')).toContainText('2020')
    await expect(page.getByTestId('tests-note')).not.toContainText('28 September 2020') // after the last real period the source has only zero rows
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

test('Sulawesi Tengah: PCR then RDT blocks, new cases per kabupaten and the case share (bars), at 1280 and 360, axe light and dark', async ({ page }) => {
  for (const [w, theme] of [[1280, 'light'], [360, 'dark']] as const) {
    await page.setViewportSize({ width: w, height: 900 })
    await page.addInitScript((t) => localStorage.setItem('pico-theme', t), theme)
    await page.goto('/data/provinsi/sulawesi-tengah')
    await hydrated(page)
    const blocks = page.locator('[data-block]')
    await expect(blocks).toHaveCount(2)
    await expect(blocks.first()).toHaveAttribute('data-block', 'pcr')
    await expect(page.getByTestId('new-cases-caption')).toContainText('Kasus baru pada')
    await expect(page.getByTestId('new-cases-chart').locator('svg[role="img"]')).toBeVisible()
    await expect(page.getByTestId('case-share').locator('svg[role="img"]')).toBeVisible()
    await expect(page.getByTestId('case-share')).not.toContainText('NaN')
    await expectNoA11yViolations(page)
  }
})
