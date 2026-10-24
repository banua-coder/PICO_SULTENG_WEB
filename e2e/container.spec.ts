import { expect, test } from './support/test'
import { visit } from './support/visit'

// Against the real nginx container, with its real Content-Security-Policy header: every page loads, hydrates, and the browser
// reports no console error, no CSP violation (securitypolicyviolation) and no blocked script, style, font or connection.
const PAGES = ['/', '/en/', '/data', '/data/provinsi/sulawesi-tengah', '/data/kabupaten/poso', '/tabel-data', '/vaksin', '/infografis', '/kontak', '/wiki', '/isoman', '/metodologi']

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
