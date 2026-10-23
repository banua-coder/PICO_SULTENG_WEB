import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole } from './support/visit'

test.describe('Vaksin', () => {
  test('the prerendered HTML has the locations and their archive note; the series comes from the client', async ({ page }) => {
    const html = await (await page.request.get('/vaksin')).text()
    expect(html).toContain('Bisa sudah tidak berlaku')
    expect(html).toContain('data-testid="locations"')
  })

  test('Sulawesi Tengah: 85,55 % and 53,63 % on 25 Maret 2022, no console noise', async ({ page }) => {
    const log = watchConsole(page)
    await visit(page, '/vaksin')
    const now = page.getByTestId('coverage-now')
    await expect(now.getByTestId('progress-text').first()).toContainText('85,55%')
    await expect(now.getByTestId('progress-text').nth(1)).toContainText('53,63%')
    await expect(now.getByTestId('vaccine-asof')).toHaveText('Data vaksinasi berhenti diperbarui pada 25 Maret 2022.')
    expect(log).toEqual([])
  })

  test('the scope radio writes ?wilayah=indonesia and the national numbers replace the provincial ones', async ({ page }) => {
    await visit(page, '/vaksin')
    await expect(page.getByTestId('progress-text').first()).toContainText('85,55%')
    await page.getByText('Indonesia', { exact: true }).click()
    await expect(page).toHaveURL(/wilayah=indonesia/)
    await expect(page.getByTestId('progress-text').first()).not.toContainText('85,55%')
    await page.getByText('Sulawesi Tengah', { exact: true }).click()
    await expect(page).not.toHaveURL(/wilayah/)
  })

  test('health workers over 100 %: a note, and doses are told apart by form, mark and label', async ({ page }) => {
    await visit(page, '/vaksin')
    await expect(page.getByTestId('over-notes')).toContainText('Tenaga kesehatan: Dosis 1 melebihi target')
    const c = page.getByTestId('doses-over-time')
    await expect(c.locator('path[data-line]')).toHaveCount(2)
    await expect(c.locator('[data-end-label]')).toHaveText(['Dosis 1', 'Dosis 2'])
  })

  test('the locations filter narrows the list and keeps focus', async ({ page }) => {
    await visit(page, '/vaksin')
    const l = page.getByTestId('locations')
    const before = await l.locator('li').count()
    await l.getByLabel('Kabupaten/Kota').focus()
    await l.getByLabel('Kabupaten/Kota').selectOption('kota-palu')
    expect(await l.locator('li').count()).toBeLessThan(before)
    await expect(l.getByLabel('Kabupaten/Kota')).toBeFocused()
    await expect(l.locator('h3')).toHaveCount(1)
  })

  test('360 px: no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/vaksin')
    await expect(page.getByTestId('doses-over-time').locator('figure')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const [locale, theme] of [['id', 'dark'], ['en', 'light']] as const) {
    test(`axe: no violations (${locale}, ${theme})`, async ({ page }) => {
      await visit(page, '/vaksin', { locale, theme })
      await expect(page.getByTestId('doses-over-time').locator('figure')).toBeVisible()
      await expect(page.getByTestId('coverage-groups').locator('figure').first()).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }
})
