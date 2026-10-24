import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { chooseOption, horizontalOverflow, visit, watchConsole } from './support/visit'

test.describe('Vaksin', () => {
  test('the prerendered HTML has the locations and their archive note; the series comes from the client', async ({ page }) => {
    const html = await (await page.request.get('/vaksin')).text()
    expect(html).toContain('Bisa sudah tidak berlaku')
    expect(html).toContain('data-testid="locations"')
  })

  test('legacy order: the sites first, then the situation and progress, then Informasi Vaksinasi COVID-19 (FAQ)', async ({ page }) => {
    await visit(page, '/vaksin')
    const y = async (id: string) => (await page.getByTestId(id).boundingBox())!.y
    expect(await y('locations')).toBeLessThan(await y('vaccine-cards'))
    expect(await y('vaccine-cards')).toBeLessThan(await y('vaccine-progress'))
    expect(await y('vaccine-progress')).toBeLessThan(await y('vaccine-info'))
    const info = page.getByTestId('vaccine-info')
    for (const q of ['Rangkuman', 'Apa itu vaksinasi?', 'Apakah vaksin itu obat?', 'Apa yang dimaksud dengan kekebalan kelompok (herd immunity)?', 'Apakah ada efek samping dari vaksinasi?']) await expect(info.getByRole('heading', { name: q })).toBeVisible()
    await expect(info.getByRole('link', { name: 'kipi.covid19.go.id' })).toHaveAttribute('href', 'https://kipi.covid19.go.id')
  })

  test('Sulawesi Tengah: 85,55 % and 53,63 % on 25 Maret 2022, no console noise', async ({ page }) => {
    const log = watchConsole(page)
    await visit(page, '/vaksin')
    const now = page.getByTestId('vaccine-progress')
    await expect(now.getByTestId('vaccine-progress-card')).toHaveCount(12)
    await expect(now.getByTestId('progress-text').first()).toContainText('85,55%')
    await expect(now.locator('[data-dose="dose2"] [data-group="total"]').getByTestId('progress-text')).toContainText('53,63%')
    await expect(page.getByTestId('vaccine-cards')).toContainText('Data vaksinasi berhenti diperbarui pada 25 Maret 2022.')
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
    await expect(page.getByTestId('vaccine-progress').locator('[data-dose="dose1"] [data-group="health_worker"]').getByTestId('progress-text')).toContainText('111,2')
    const c = page.getByTestId('doses-over-time')
    await expect(c.locator('path[data-line]')).toHaveCount(2)
    await expect(c.locator('[data-end-label]')).toHaveText(['Dosis 1', 'Dosis 2'])
  })

  test('the locations filter narrows the list and keeps focus', async ({ page }) => {
    await visit(page, '/vaksin')
    const l = page.getByTestId('locations')
    const before = await l.locator('li').count()
    const filter = l.getByRole('combobox', { name: 'Kabupaten/Kota' })
    await chooseOption(page, filter, 'Kota Palu')
    expect(await l.locator('li').count()).toBeLessThan(before)
    await expect(filter).toBeFocused() // the trigger keeps focus when the list changes
    await expect(l.locator('h3')).toHaveCount(1)
  })

  test('360 px: no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await visit(page, '/vaksin')
    await expect(page.getByTestId('doses-over-time').locator('figure')).toBeVisible()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  for (const width of [1280, 360]) {
    for (const [locale, theme] of [['id', 'dark'], ['en', 'light'], ['id', 'light']] as const) {
      test(`axe: no violations (${locale}, ${theme}, ${width} px)`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await visit(page, '/vaksin', { locale, theme })
        await expect(page.getByTestId('doses-over-time').locator('figure')).toBeVisible()
        await expect(page.getByTestId('vaccine-progress-card').first()).toBeVisible()
        await expectNoA11yViolations(page)
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
      })
    }
  }
})
