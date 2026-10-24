import type { Page } from '@playwright/test'
import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole, watchRequests } from './support/visit'

// third-party images are not part of what is tested (and some are unreachable): fail them quickly
const noRemoteImages = (page: Page) => page.route((u) => !['localhost', 'pico-api.banuacoder.com'].includes(u.hostname), (r) => (r.request().resourceType() === 'image' ? r.abort('failed') : r.continue()))

test.describe('Isoman', () => {
  test('the prerendered HTML has the notice, the guide and the lists; hydrating makes no API request and no console noise', async ({ page }) => {
    const html = await (await page.request.get('/isoman')).text()
    expect(html).toContain('Jangan mengirim uang')
    expect(html).toContain('Tanda bahaya')
    expect(html).toContain('data-testid="telemedicine-grid"')
    expect(html).toContain('data-testid="donation-grid"')
    await noRemoteImages(page)
    const api = watchRequests(page)
    const log = watchConsole(page)
    await visit(page, '/isoman')
    await page.waitForLoadState('networkidle')
    expect(api).toEqual([])
    expect(log).toEqual([])
  })

  test('the day filter narrows the doctors with the keyboard', async ({ page }) => {
    await visit(page, '/isoman')
    const grid = page.getByTestId('telemedicine-grid').getByRole('article')
    const all = await grid.count()
    await page.getByLabel('Hari', { exact: true }).selectOption('Minggu')
    await expect(page.getByRole('status').filter({ hasText: 'Menampilkan' })).toContainText(`dari ${all} dokter`)
    expect(await grid.count()).toBeLessThan(all)
    expect(await grid.count()).toBeGreaterThan(0)
  })

  test('copying an account number announces it and copies digits only', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await noRemoteImages(page)
    await visit(page, '/isoman')
    const card = page.getByTestId('donation-grid').getByRole('article').first()
    await card.getByRole('button', { name: /Salin/ }).first().click()
    await expect(card.getByRole('status').first()).toHaveText('Nomor rekening disalin')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^\d+$/)
  })

  test('360 px: no sideways scroll', async ({ page }) => {
    await noRemoteImages(page)
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/isoman')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const [locale, theme] of [['id', 'light'], ['en', 'dark']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await noRemoteImages(page)
      await visit(page, '/isoman', { locale, theme })
      await expect(page.getByTestId('donation-grid')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
