import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from './support/test'
import { visit } from './support/visit'

const fixture = (n: string) => readFileSync(fileURLToPath(new URL(`../test/fixtures/api/${n}.json`, import.meta.url)), 'utf8')
const SERIES = '**/api/v1/provinces/72/cases**'
const CUSTOM_END = '/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31' // needs the series: the latest row would be the wrong day

// Spec 80: API 500 and offline, on a data page. StatusView shows (alert), and its retry works.
test.describe('Data page: the series request fails', () => {
  test('HTTP 500: an error state with a retry button, and retry brings the figures', async ({ page }) => {
    await page.route(SERIES, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"error","error":"boom"}' }))
    await page.goto(CUSTOM_END)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Data gagal dimuat')
    await expect(page.getByTestId('summary')).toHaveCount(0)
    await page.unroute(SERIES)
    await page.route(SERIES, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: fixture('province-72-cases') }))
    await alert.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByTestId('summary')).toContainText('31 Juli 2021')
    await expect(alert).toHaveCount(0)
  })

  test('offline: the same, in English', async ({ page }) => {
    await page.route(SERIES, (r) => r.abort('failed'))
    await visit(page, '/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31', { locale: 'id' })
    await expect(page.getByRole('alert')).toBeVisible()
    await page.unroute(SERIES)
    await page.goto('/en/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31')
    await page.route(SERIES, (r) => r.abort('failed'))
    await page.reload()
    await expect(page.getByRole('alert')).toContainText(/Data could not be loaded|No connection/)
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
  })

  test('the page keeps working when only the series fails: the prerendered figures stay', async ({ page }) => {
    await page.route(SERIES, (r) => r.fulfill({ status: 500, body: '{"status":"error","error":"x"}' }))
    await page.goto('/data/provinsi/sulawesi-tengah')
    await expect(page.getByTestId('summary')).toContainText('14 Januari 2024') // from the latest row in the page's initial state
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Data Sulawesi Tengah')
  })
})

// A content page reads small resources from the state block the prerender wrote. Without that block (stripped here) the client
// asks the API itself: a 500 gives the error state and retry brings the content.
test('a content page shows StatusView on API 500 and retry works (Kontak)', async ({ page }) => {
  await page.route('**/kontak', async (route) => {
    const res = await route.fetch()
    await route.fulfill({ response: res, body: (await res.text()).replace(/<script id="pico-state"[\s\S]*?<\/script>/, '') })
  })
  await page.route('**/api/v1/hospitals**', (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"error","error":"boom"}' }))
  await page.goto('/kontak')
  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Data gagal dimuat')
  await expect(page.getByRole('article')).toHaveCount(0)
  await page.unroute('**/api/v1/hospitals**')
  await page.route('**/api/v1/hospitals**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: fixture('hospitals') }))
  await alert.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByRole('article').first()).toBeVisible()
  await expect(alert).toHaveCount(0)
})
