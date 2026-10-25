import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './support/test'
import { hydrated } from './support/a11y'
import { describePair, fails, focusRing, scanContrast } from './support/contrast'
import { visit } from './support/visit'

// Contrast in the states a static scan never sees (docs/contrast-audit.md): our computed-style scan (SVG text, graphics, map fills, control
// borders, placeholders) on every route, then hover, keyboard focus, chart and map tooltips, every map metric in dark mode, and the open
// popups, each with axe colour-contrast as a second opinion. The full audit with screenshots is playwright.audit.config.ts.
const ROUTES = ['/', '/mulai', '/data/indonesia', '/data/provinsi/sulawesi-tengah', '/data/kabupaten/kota-palu', '/vaksin', '/isoman', '/kontak', '/wiki', '/infografis', '/tabel-data', '/metodologi']
const THEMES = ['light', 'dark'] as const
const settle = (page: Page) => page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)))

async function expectContrast(page: Page, scope?: string) {
  await settle(page)
  expect(fails(await scanContrast(page, { scope })).map(describePair)).toEqual([])
  const axe = new AxeBuilder({ page }).withRules(['color-contrast'])
  const { violations } = await (scope ? axe.include(scope) : axe).analyze()
  expect(violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary}`))).toEqual([])
}

const mark = (page: Page, css: string, i: number, attr = 'data-check') =>
  page.evaluate(
    ([c, n, a]) => {
      document.querySelectorAll(`[${a}]`).forEach((e) => e.removeAttribute(a as string))
      document.querySelectorAll(c as string)[n as number]?.setAttribute(a as string, '')
    },
    [css, i, attr] as const,
  )

for (const theme of THEMES) {
  for (const route of ROUTES)
    test(`${theme} ${route}: every text, graphic and control pair`, async ({ page }) => {
      await visit(page, route, { theme })
      await page.evaluate(() => document.fonts.ready)
      await expectContrast(page)
    })

  test(`${theme}: hover on every button, link and tab keeps its contrast`, async ({ page }) => {
    test.setTimeout(120_000)
    for (const route of ['/', '/isoman', '/data/provinsi/sulawesi-tengah', '/infografis']) {
      await visit(page, route, { theme })
      const sel = 'header a, header button, main a[data-slot="button"], main button, main [role="tab"], main a.no-underline'
      const n = Math.min(await page.locator(sel).count(), 40)
      for (let i = 0; i < n; i++) {
        await mark(page, sel, i)
        const el = page.locator('[data-check]')
        if (!(await el.isVisible()) || (await el.isDisabled().catch(() => false))) continue
        await el.hover({ timeout: 2000 }).catch(() => undefined)
        await settle(page)
        expect(fails(await scanContrast(page, { scope: '[data-check]' })).map((p) => `${route} hover ${describePair(p)}`)).toEqual([])
      }
      await page.mouse.move(0, 0)
    }
  })

  test(`${theme}: every focus ring reaches 3:1 against what is around it`, async ({ page }) => {
    test.setTimeout(120_000)
    for (const [route, width] of [['/', 1280], ['/', 360], ['/data/provinsi/sulawesi-tengah', 1280], ['/tabel-data', 1280]] as const) {
      await page.setViewportSize({ width, height: 800 })
      await visit(page, route, { theme })
      const seen: string[] = []
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab')
        await settle(page) // the ring of a Button grows in with transition-all
        const r = await focusRing(page)
        if (!r) break
        seen.push(r.selector)
        expect(r.ratio, `${route} ${width} ${describePair(r)}`).toBeGreaterThanOrEqual(3)
      }
      expect(seen.length, `${route} ${width}: ${seen.join(" ; ")}`).toBeGreaterThan(5)
    }
  })

  test(`${theme}: chart and map tooltips, every map metric, the open popups`, async ({ page }) => {
    test.setTimeout(120_000)
    await visit(page, '/data/provinsi/sulawesi-tengah', { theme })
    // chart tooltips
    const plots = page.locator('[data-chart] [role="group"][tabindex="0"]')
    await expect.poll(() => plots.count()).toBeGreaterThan(1) // drawn once their box has a width
    for (let i = 0; i < (await plots.count()); i++) {
      const plot = plots.nth(i)
      await plot.scrollIntoViewIfNeeded()
      const b = (await plot.boundingBox())!
      await page.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2)
      await expect(page.locator('[data-tooltip]')).toBeVisible()
      await expectContrast(page, '[data-tooltip]')
      await mark(page, '[data-chart] [role="group"][tabindex="0"]', i)
      await expectContrast(page, '[data-check]') // the crosshair marks over the plot
    }
    await page.mouse.move(0, 0)
    // the map: every metric and mode (fills, the numbers printed on them, the legend), then its tooltip
    const map = page.getByTestId('submap')
    const controls = map.locator('[data-slot="toggle-group-item"]')
    for (let i = 0; i < (await controls.count()); i++) {
      await controls.nth(i).click()
      await expectContrast(page, '[data-testid="submap"]')
    }
    const area = map.locator('g[role="link"]').first()
    await area.scrollIntoViewIfNeeded()
    await area.hover({ force: true })
    await expect(map.locator('[data-tooltip]')).toBeVisible()
    await expectContrast(page, '[data-testid="submap"] [data-tooltip]')
    await page.mouse.move(0, 0)
    // popups: the area selects and the date range calendar
    const openers = page.locator('main [data-slot="select-trigger"], main [data-slot="popover-trigger"]')
    for (let i = 0; i < (await openers.count()); i++) {
      await openers.nth(i).click()
      const popup = page.locator('[role="listbox"], [data-slot="popover-content"]').first()
      await expect(popup).toBeVisible()
      await mark(page, '[role="listbox"], [data-slot="popover-content"]', 0)
      await expectContrast(page, '[data-check]')
      const first = page.locator('[data-check] [role="option"], [data-check] button').first()
      await first.hover()
      await expectContrast(page, '[data-check]')
      await page.keyboard.press('Escape')
      await expect(popup).toBeHidden()
    }
  })
}

test('the scan really fails: SVG text on a fill, a pale graphic, a pale focus ring', async ({ page }) => {
  await page.goto('/_kit')
  await hydrated(page)
  await page.evaluate(() => {
    const main = document.querySelector('main')!
    main.insertAdjacentHTML(
      'beforeend',
      `<svg width="200" height="60" data-probe><rect width="200" height="60" style="fill:#2563eb"/><text x="10" y="30" style="fill:#3b82f6">pale on blue</text></svg>
       <svg width="60" height="20" data-probe-line><line x1="0" x2="60" y1="10" y2="10" style="stroke:#e5e7eb" stroke-width="2"/></svg>
       <button type="button" data-probe-btn style="outline:2px solid #e5e7eb">probe</button>`,
    )
  })
  const text = fails(await scanContrast(page, { scope: '[data-probe]' }))
  expect(text.map((p) => p.kind)).toContain('text')
  expect(fails(await scanContrast(page, { scope: '[data-probe-line]' })).map((p) => p.kind)).toEqual(['graphic'])
  await page.locator('[data-probe-btn]').focus()
  await page.evaluate(() => (document.querySelector('[data-probe-btn]') as HTMLElement).setAttribute('style', 'outline:2px solid #e5e7eb !important'))
  expect((await focusRing(page))!.ratio).toBeLessThan(3)
})
