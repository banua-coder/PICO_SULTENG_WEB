import { expect, test } from './support/test'
import { expectNoA11yViolations, hydrated } from './support/a11y'

// the blocked image host of C1 Q7 / A5: the request fails, the page must still look finished
test.beforeEach(async ({ page }) => {
  await page.route('https://i.ibb.co/**', (r) => r.abort())
})

for (const path of ['/_kit', '/en/_kit']) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${path} passes axe in ${theme} (WCAG 2.2 A and AA)`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('pico-theme', t), theme)
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await expectNoA11yViolations(page)
    })
  }
}

test('PicoImage: three missing-image cases keep the box, CLS is 0', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as { __cls: number }).__cls = 0
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value
    }).observe({ type: 'layout-shift', buffered: true })
  })
  await page.goto('/_kit')
  await hydrated(page)
  await page.waitForLoadState('networkidle')
  const cls = () => page.evaluate(() => (window as unknown as { __cls: number }).__cls)
  const boxes = page.getByTestId('images').locator('> div')
  await expect(boxes).toHaveCount(4)
  const settled = await cls() // whatever the page did while loading is not the images' doing
  await boxes.first().scrollIntoViewIfNeeded() // images are lazy: bring them into view so the 404 and blocked-host errors happen
  const before = await boxes.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
  await expect(page.locator('[data-placeholder]')).toHaveCount(3) // every blocked or missing image has fallen back
  const after = await boxes.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))
  expect(after).toEqual(before)
  expect(new Set(after).size).toBe(1) // all four boxes have the same size
  expect((await cls()) - settled).toBe(0) // the images and their placeholders cause no layout shift
  expect(await cls()).toBeLessThan(0.01) // and the whole page stays far under the "good" limit
})

test('the kit and the home page never load the animation library, an animation file or a weave illustration (posters only)', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (r) => requested.push(r.url()))
  await page.goto('/_kit')
  await page.waitForLoadState('networkidle')
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(requested.filter((u) => /lottie_light|lottie\/[a-z-]+\.json|weave|tenun|pico-hero/i.test(u))).toEqual([])
})

test('the hero illustration is never loaded by the kit', async ({ page }) => {
  const requested: string[] = []
  page.on('request', (r) => requested.push(r.url()))
  await page.goto('/_kit')
  await page.waitForLoadState('networkidle')
  expect(requested.filter((u) => /hero/i.test(u))).toEqual([])
})

test('prerendered kit page has no console warnings (hydration)', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (m) => ['warning', 'error'].includes(m.type()) && !/ERR_FAILED|Failed to load resource/.test(m.text()) && logs.push(m.text()))
  await page.goto('/_kit')
  await page.waitForLoadState('networkidle')
  expect(logs).toEqual([])
})

test('the axe helper really fails on a violation (proof the scans are live)', async ({ page }) => {
  await page.goto('/_kit')
  await hydrated(page)
  await page.evaluate(() => {
    const p = document.createElement('p')
    p.textContent = 'low contrast'
    p.style.cssText = 'color:#bbb;background:#fff'
    document.querySelector('main')!.append(p)
  })
  await expect(expectNoA11yViolations(page)).rejects.toThrow()
})
