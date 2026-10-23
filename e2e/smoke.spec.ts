import { expect, test } from './support/test'

test('home renders its heading', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'PICO Sulteng' })).toBeVisible()
})
