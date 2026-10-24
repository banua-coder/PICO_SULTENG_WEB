import { expect, test } from './support/test'
import { expectNoA11yViolations, hydrated } from './support/a11y'
import { chooseOption, toggle } from './support/visit'

// Acceptance point 9: the level switch (Nasional, Provinsi, Kabupaten/Kota) moves the cards, the map and the charts together,
// keeps the filters (?jenis, ?dari, ?sampai, ?tampilan) and is in the URL.
const LEVELS = [
  { name: 'Nasional', path: '/data/indonesia', h1: 'Data Indonesia', cols: 1, maps: 1 },
  { name: 'Provinsi', path: '/data/provinsi/sulawesi-tengah', h1: 'Data Sulawesi Tengah', cols: 2, maps: 2 },
  { name: 'Kabupaten/Kota', path: '/data/kabupaten/kota-palu', h1: 'Data Kota Palu', cols: 2, maps: 1 },
] as const

for (const l of LEVELS) {
  test(`level ${l.name}: cards, map and charts follow the area (${l.path})`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${l.path}?jenis=recovered&dari=2021-07-01&sampai=2021-07-31`)
    await hydrated(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(l.h1)
    await expect(toggle(page, l.name, 'Tingkat')).toHaveAttribute('data-state', 'on')
    const cards = page.getByTestId('summary').locator('[data-state]')
    await expect(cards).toHaveCount(4)
    await expect(cards.first().locator('[data-column]')).toHaveCount(l.cols)
    await expect(page.getByTestId('geo-map')).toHaveCount(l.maps) // Nasional: provinces; a province: its map (Sulawesi Tengah adds the kabupaten map); kabupaten: the 13
    await expect(page.getByTestId('curves').locator('svg').first()).toBeVisible()
    await expect(page.getByTestId('rt-section')).toBeVisible()
    await expectNoA11yViolations(page)
  })
}

test('the switch moves between levels and keeps the filters', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/data/provinsi/sulawesi-tengah?jenis=recovered&dari=2021-07-01&tampilan=kumulatif')
  await hydrated(page)
  await toggle(page, 'Nasional', 'Tingkat').click()
  await expect(page).toHaveURL(/\/data\/indonesia\?(?=.*jenis=recovered)(?=.*dari=2021-07-01)(?=.*tampilan=kumulatif)/)
  await toggle(page, 'Kabupaten/Kota', 'Tingkat').click()
  await expect(page).toHaveURL(/\/data\/kabupaten\/kota-palu\?(?=.*jenis=recovered)/)
  await chooseOption(page, page.getByRole('combobox', { name: /Pilih kabupaten/ }), 'Poso')
  await expect(page).toHaveURL(/\/data\/kabupaten\/poso\?(?=.*dari=2021-07-01)/)
  await toggle(page, 'Provinsi', 'Tingkat').click()
  await expect(page).toHaveURL(/\/data\/provinsi\/sulawesi-tengah/)
})

test('a link with ?tingkat and ?wilayah opens that area and keeps the other filters', async ({ page }) => {
  await page.goto('/data?tingkat=provinsi&wilayah=bali&jenis=deceased')
  await hydrated(page)
  await expect(page).toHaveURL(/\/data\/provinsi\/bali\?jenis=deceased$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data Bali')
})
