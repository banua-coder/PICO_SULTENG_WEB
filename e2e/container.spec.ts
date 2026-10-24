import { expect, test } from './support/test'
import { visit } from './support/visit'

// Against the real nginx container, with its real Content-Security-Policy header: every page loads, hydrates, and the browser
// reports no console error, no CSP violation (securitypolicyviolation) and no blocked script, style, font or connection.
const PAGES = ['/', '/en/', '/mulai', '/en/mulai', '/data', '/data/provinsi/sulawesi-tengah', '/data/kabupaten/poso', '/tabel-data', '/vaksin', '/infografis', '/kontak', '/wiki', '/isoman', '/metodologi']

test('the CSP header is the real one', async ({ page }) => {
  const res = await page.request.get('/data')
  expect(res.headers()['content-security-policy']).toContain("script-src 'self'")
})

for (const path of PAGES) {
  test(`${path}: no CSP violation and no console error`, async ({ page }) => {
    const problems: string[] = []
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) => ((window as unknown as { __csp: string[] }).__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`))
    })
    // third-party image failures are expected and not CSP-related ("Failed to load resource"); a CSP block says "Refused to"
    page.on('console', (m) => ['error', 'warning'].includes(m.type()) && !/Failed to load resource/.test(m.text()) && problems.push(`${m.type()}: ${m.text().slice(0, 200)}`))
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 200)}`))
    await visit(page, path)
    await page.waitForLoadState('networkidle')
    const csp = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
    expect(csp).toEqual([])
    expect(problems).toEqual([])
  })
}

// The shadcn-vue controls (reka-ui) render their popups at run time: they must work under the real CSP (no inline <style> element, no eval).
test('the Select, the calendar popover, the nav menu and the phone sheet open under the CSP without a violation', async ({ page }) => {
  const problems: string[] = []
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => ((window as unknown as { __csp: string[] }).__csp ??= []).push(`${e.violatedDirective} ${e.blockedURI}`))
  })
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && !/Failed to load resource/.test(m.text()) && problems.push(`${m.type()}: ${m.text().slice(0, 200)}`))
  await visit(page, '/data')
  // the level switch (Nasional, Provinsi, Kabupaten/Kota) and the area Select of the chosen level
  await expect(page.getByRole('group', { name: 'Tingkat' })).toBeVisible()
  await page.getByRole('combobox', { name: 'Pilih provinsi (34)' }).click()
  await expect(page.getByRole('option', { name: 'Bali', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('group', { name: 'Tingkat' }).locator('[data-slot="toggle-group-item"]', { hasText: /^Kabupaten\/Kota$/ }).click()
  await expect(page).toHaveURL(/\/data\/kabupaten\/kota-palu/)
  await page.getByRole('combobox', { name: /Pilih kabupaten/ }).click()
  await expect(page.getByRole('option', { name: 'Poso', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByTestId('range-trigger')).toHaveAttribute('aria-haspopup', 'dialog') // the lazy calendar chunk has hydrated
  await page.getByTestId('range-trigger').click()
  await expect(page.getByRole('gridcell').first()).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Lainnya' }).click()
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('link', { name: 'Metodologi', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 360, height: 740 })
  await page.getByRole('navigation', { name: 'Navigasi bawah' }).getByRole('button', { name: 'Lainnya' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  const csp = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? [])
  expect(csp).toEqual([])
  expect(problems).toEqual([])
})
