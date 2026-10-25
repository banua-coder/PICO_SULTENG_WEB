import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import AxeBuilder from '@axe-core/playwright'
import { test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { hydrated } from '../support/a11y'
import { fails, focusRing, scanContrast } from '../support/contrast'
import type { Pair } from '../support/contrast'

// The full contrast audit (docs/contrast-audit.md), not part of CI: every route x light/dark x 1280/360, the static page, then hover,
// focus, tooltips and every map metric. Writes one JSON per run to audit-results/contrast/ and crops of failures to
// audit-results/contrast/<label>/shots/ (raw, not committed) and the curated pairs of the doc to docs/screenshots/contrast/. Run against a build:  pnpm exec playwright test -c playwright.audit.config.ts
// AUDIT_LABEL=before|after names the output folder.
const ROUTES = ['/', '/mulai', '/data', '/data/indonesia', '/data/provinsi/sulawesi-tengah', '/data/kabupaten/kota-palu', '/vaksin', '/isoman', '/kontak', '/wiki', '/infografis', '/tabel-data', '/metodologi']
const label = process.env.AUDIT_LABEL ?? 'run'
const outDir = fileURLToPath(new URL(`../../audit-results/contrast/${label}/`, import.meta.url))
const shotDir = fileURLToPath(new URL(`../../audit-results/contrast/${label}/shots/`, import.meta.url))
mkdirSync(outDir, { recursive: true })
mkdirSync(shotDir, { recursive: true })

const settle = (page: Page) => page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)))
const tag = (page: Page, css: string, i: number) =>
  page.evaluate(([c, n]) => {
    document.querySelectorAll('[data-audit]').forEach((e) => e.removeAttribute('data-audit'))
    const el = document.querySelectorAll(c as string)[n as number]
    el?.setAttribute('data-audit', '')
    return !!el
  }, [css, i] as const)

for (const route of ROUTES)
  for (const theme of ['light', 'dark'] as const)
    for (const width of [1280, 360]) {
      test(`${route} ${theme} ${width}`, async ({ page }) => {
        test.setTimeout(600_000)
        await page.setViewportSize({ width, height: width > 400 ? 800 : 740 })
        await page.addInitScript((t) => localStorage.setItem('pico-theme', t), theme)
        await page.goto(route)
        await hydrated(page)
        await page.waitForLoadState('networkidle')
        await page.evaluate(() => document.fonts.ready)
        await settle(page)
        const found: (Pair & { state: string })[] = []
        const add = (state: string, ps: Pair[]) => found.push(...ps.map((p) => ({ ...p, state })))

        add('static', await scanContrast(page, { all: true }))
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
        const axeOut = {
          violations: axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })) })),
          incomplete: axe.incomplete.filter((v) => v.id === 'color-contrast').flatMap((v) => v.nodes.map((n) => ({ target: n.target.join(' '), why: n.any.map((a) => a.message).join('; ') }))),
        }

        // without the animation wait: does anything fail only in the first frames?
        await page.reload()
        await hydrated(page)
        const early = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
        const earlyOut = early.violations.flatMap((v) => v.nodes.map((n) => ({ target: n.target.join(' '), summary: n.failureSummary })))
        await page.waitForLoadState('networkidle')
        await settle(page)

        // hover every control in view of the user
        const hoverable = 'header a, header button, main a, main button, main [role=tab], main summary, main [role=link], footer a, nav a, nav button'
        const n = Math.min(await page.locator(hoverable).count(), 80)
        for (let i = 0; i < n; i++) {
          if (!(await tag(page, hoverable, i))) continue
          const el = page.locator('[data-audit]')
          if (!(await el.isVisible())) continue
          await el.hover({ timeout: 2000 }).catch(() => undefined)
          await page.waitForTimeout(50)
          await settle(page)
          add('hover', await scanContrast(page, { scope: '[data-audit]', all: true }))
          if (await page.locator('[data-tooltip]').count()) add('tooltip', await scanContrast(page, { scope: '[data-tooltip]', all: true }))
        }
        await page.mouse.move(0, 0)

        // tooltips of every chart and the first areas of every map
        const surfaces = page.locator('[data-chart] [role=group][tabindex="0"], [data-rt-chart] [role=group][tabindex="0"]')
        for (let i = 0; i < (await surfaces.count()); i++) {
          const s = surfaces.nth(i)
          await s.scrollIntoViewIfNeeded()
          const b = await s.boundingBox()
          if (!b) continue
          await page.mouse.move(b.x + b.width * 0.6, b.y + b.height / 2)
          await page.waitForTimeout(150)
          add('tooltip', await scanContrast(page, { scope: '[data-tooltip]', all: true }))
          await s.evaluate((e) => {
            document.querySelectorAll('[data-audit]').forEach((x) => x.removeAttribute('data-audit'))
            e.setAttribute('data-audit', '')
          })
          add('chart-hover', await scanContrast(page, { scope: '[data-audit]', all: true }))
        }
        // every map metric (Positif, Dirawat, Sembuh, Meninggal) and mode (Sebaran, Titik): the fills and the numbers printed on them
        const maps = page.locator('[data-testid="geo-map"]')
        for (let m = 0; m < (await maps.count()); m++) {
          const scope = await page.evaluate((k) => {
            document.querySelectorAll('[data-audit-map]').forEach((e) => e.removeAttribute('data-audit-map'))
            const svg = document.querySelectorAll('[data-testid="geo-map"]')[k]!
            const sec = svg.closest('section') ?? svg.closest('figure') ?? svg.parentElement!.parentElement!
            sec.setAttribute('data-audit-map', '')
            return sec.querySelectorAll('[data-slot="toggle-group-item"], [role=tab], [role=radio]').length
          }, m)
          const controls = page.locator('[data-audit-map] [data-slot="toggle-group-item"], [data-audit-map] [role=tab], [data-audit-map] [role=radio]')
          for (let c = -1; c < scope; c++) {
            if (c >= 0) {
              const ctl = controls.nth(c)
              if (!(await ctl.isVisible()) || (await ctl.isDisabled())) continue
              await ctl.click()
              await page.waitForTimeout(250)
            }
            add(`map${c >= 0 ? `:${(await controls.nth(c).innerText()).trim()}` : ''}`, await scanContrast(page, { scope: '[data-audit-map]', all: true }))
          }
          const area = maps.nth(m).locator('g[role=link]').first()
          await area.scrollIntoViewIfNeeded()
          await area.hover({ force: true }).catch(() => undefined)
          await page.waitForTimeout(150)
          add('map-tooltip', await scanContrast(page, { scope: '[data-tooltip]', all: true }))
          add('map-hover', await scanContrast(page, { scope: '[data-audit-map]', all: true }))
          await page.mouse.move(0, 0)
        }

        // open popups: every select, popover trigger and dialog button, then the listbox, calendar, sheet or dialog it opens
        const openers = page.locator('main [data-slot="select-trigger"], main [data-slot="popover-trigger"], [aria-haspopup="dialog"]:visible, main button[aria-haspopup]')
        for (let i = 0; i < Math.min(await openers.count(), 12); i++) {
          const o = openers.nth(i)
          if (!(await o.isVisible()) || (await o.isDisabled())) continue
          await o.scrollIntoViewIfNeeded()
          await o.click().catch(() => undefined)
          await page.waitForTimeout(150)
          await settle(page)
          const popup = '[role="listbox"], [role="dialog"], [data-slot="popover-content"], [data-slot="sheet-content"]'
          if (await page.locator(popup).count()) {
            await page.evaluate((c) => {
              document.querySelectorAll('[data-audit-pop]').forEach((e) => e.removeAttribute('data-audit-pop'))
              document.querySelector(c)?.setAttribute('data-audit-pop', '')
            }, popup)
            add('popup', await scanContrast(page, { scope: '[data-audit-pop]', all: true }))
            // hover the first options/days in it
            const items = page.locator('[data-audit-pop] [role="option"], [data-audit-pop] button, [data-audit-pop] a')
            for (let k = 0; k < Math.min(await items.count(), 6); k++) {
              await items.nth(k).hover({ timeout: 1000 }).catch(() => undefined)
              await settle(page)
              add('popup-hover', await scanContrast(page, { scope: '[data-audit-pop]', all: true }))
            }
          }
          await page.keyboard.press('Escape')
          await page.waitForTimeout(150)
        }

        // focus: Tab through the page
        await page.reload()
        await hydrated(page)
        await page.waitForLoadState('networkidle')
        await settle(page)
        const rings: Pair[] = []
        for (let i = 0; i < 150; i++) {
          await page.keyboard.press('Tab')
          await settle(page) // the focus ring of a Button grows in with transition-all: read it once it has
          const r = await focusRing(page)
          if (!r) break
          rings.push(r)
          await page.evaluate(() => {
            document.querySelectorAll('[data-audit]').forEach((e) => e.removeAttribute('data-audit'))
            document.activeElement?.setAttribute('data-audit', '')
          })
          await page.waitForTimeout(60)
          add('focus', await scanContrast(page, { scope: '[data-audit]', all: true }))
          if (i > 3 && rings.length > 4 && r.selector === rings[0]!.selector) break
        }
        add('focus-ring', rings)

        // touch targets (2.5.8: 24 px, the project rule C3: 44 px)
        const targets = await page.evaluate(() =>
          [...document.querySelectorAll('a[href], button, [role=button], [role=tab], [role=link], [role=switch], [role=combobox], input, select, summary, [tabindex="0"]')]
            .filter((e) => e.checkVisibility() && !e.closest('[aria-hidden=true]'))
            .map((e) => {
              const r = e.getBoundingClientRect()
              const inline = getComputedStyle(e).display === 'inline' && !!e.closest('p,li,td')
              return { sel: `${e.tagName.toLowerCase()}${e.getAttribute('data-slot') ? `[data-slot=${e.getAttribute('data-slot')}]` : ''} "${(e.getAttribute('aria-label') ?? e.textContent ?? '').trim().slice(0, 30)}"`, w: Math.round(r.width), h: Math.round(r.height), inline, svg: e instanceof SVGElement }
            })
            .filter((t) => t.w > 0 && (t.w < 44 || t.h < 44)),
        )

        const failing = found.filter((p) => !p.exempt && p.ratio < p.need)
        // one crop per distinct failing pair
        const crops = new Set<string>()
        for (const f of failing) {
          const key = `${f.kind}|${f.fg}|${f.bg}|${f.state}`
          if (crops.has(key) || crops.size >= 12) continue
          crops.add(key)
          const [x, y, w, h] = f.box
          const file = `${route.replace(/\//g, '_') || '_'}-${theme}-${width}-${crops.size}.png`
          await page
            .screenshot({ path: `${shotDir}${file}`, fullPage: true, clip: { x: Math.max(0, x - 24), y: Math.max(0, y - 24), width: Math.min(width, w + 48), height: Math.min(400, h + 48) } })
            .then(() => Object.assign(f, { shot: file }))
            .catch(() => undefined)
        }
        writeFileSync(`${outDir}${route.replace(/\//g, '_') || '_'}-${theme}-${width}.json`, JSON.stringify({ route, theme, width, pairs: found, failing: fails(found).length, axe: axeOut, early: earlyOut, targets }, null, 1))
      })
    }

// Forced colours, reduced motion and reflow, once per route
for (const route of ROUTES)
  test(`modes ${route}`, async ({ page }) => {
    test.setTimeout(180_000)
    const name = route.replace(/\//g, '_') || '_'
    const result: Record<string, unknown> = { route }
    // forced colours (Windows high contrast): what the charts and maps keep
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' })
    await page.goto(route)
    await hydrated(page)
    await page.waitForLoadState('networkidle')
    await settle(page)
    result.forced = fails(await scanContrast(page, { all: true })).map((p) => ({ kind: p.kind, fg: p.fg, bg: p.bg, ratio: p.ratio, note: p.note, selector: p.selector }))
    await page.screenshot({ path: `${shotDir}forced${name}.png`, fullPage: false })
    // reduced motion: nothing may still move once the page has loaded
    await page.emulateMedia({ forcedColors: 'none', colorScheme: 'light', reducedMotion: 'reduce' })
    await page.goto(route)
    await hydrated(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
    result.motion = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => `${a.constructor.name} ${(a as CSSAnimation).animationName ?? (a as CSSTransition).transitionProperty} on ${(a.effect as KeyframeEffect)?.target?.tagName}.${String((a.effect as KeyframeEffect)?.target?.className).slice(0, 40)}`))
    const a = await page.screenshot()
    await page.waitForTimeout(900)
    const b = await page.screenshot()
    result.stillFrame = a.equals(b)
    // reflow: 320 CSS px (1280 at 400 %) and 640 (1280 at 200 %)
    for (const w of [320, 640]) {
      await page.setViewportSize({ width: w, height: w === 320 ? 256 * 2 : 400 })
      await page.waitForTimeout(300)
      result[`overflow${w}`] = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    }
    writeFileSync(`${outDir}modes${name}.json`, JSON.stringify(result, null, 1))
  })

// The curated before/after crops of docs/contrast-audit.md (docs/screenshots/contrast/<label>-<name>.png)
const docDir = fileURLToPath(new URL('../../docs/screenshots/contrast/', import.meta.url))
type Shot = { name: string; route: string; theme: 'light' | 'dark'; width: number; target: string; act?: (page: Page) => Promise<unknown>; pad?: number }
const SHOTS: Shot[] = [
  { name: 'heading-anchor', route: '/', theme: 'light', width: 1280, target: 'main h2 >> nth=0' },
  { name: 'case-card-chips', route: '/', theme: 'light', width: 1280, target: '[data-state="recovered"] >> nth=0' },
  { name: 'download-hover', route: '/', theme: 'light', width: 1280, target: 'header a[data-slot="button"]:has(.lucide-smartphone)', act: (p) => p.locator('header a[data-slot="button"]:has(.lucide-smartphone)').hover() },
  { name: 'risk-cta-hover', route: '/', theme: 'dark', width: 1280, target: '[data-testid="risk-cta"]', act: (p) => p.locator('[data-testid="risk-cta"] a').first().hover() },
  { name: 'risk-cta-focus', route: '/', theme: 'light', width: 1280, target: '[data-testid="risk-cta"]', act: (p) => p.locator('[data-testid="risk-cta"] a').first().focus() },
  { name: 'tab-bar-focus', route: '/', theme: 'light', width: 360, target: 'nav.fixed', act: async (p) => { await p.locator('nav.fixed a').nth(1).focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab') } },
  { name: 'hotline-hover', route: '/', theme: 'dark', width: 1280, target: '[data-slot="card"]:has(.lucide-phone-call)', act: (p) => p.locator('a:has(.lucide-phone-call)').first().hover() },
  { name: 'select-chevron', route: '/data/provinsi/sulawesi-tengah', theme: 'light', width: 1280, target: 'main [data-slot="select-trigger"] >> nth=0' },
  { name: 'calendar-dark', route: '/data/provinsi/sulawesi-tengah', theme: 'dark', width: 1280, target: '[data-slot="popover-content"]', act: (p) => p.locator('main [data-slot="popover-trigger"]').first().click() },
  { name: 'legend-dark', route: '/data/provinsi/sulawesi-tengah', theme: 'dark', width: 1280, target: '[data-testid="submap"]', act: (p) => p.getByTestId('submap').locator('[data-slot="toggle-group-item"]').nth(3).click() },
  { name: 'date-input-focus', route: '/tabel-data', theme: 'light', width: 1280, target: '#tabel-jump', pad: 12, act: async (p) => { await p.locator('#tabel-jump').focus(); for (let i = 0; i < 3; i++) await p.keyboard.press('Tab') } },
  {
    name: 'reflow-640',
    route: '/data/provinsi/sulawesi-tengah',
    theme: 'light',
    width: 1280,
    target: '[data-testid="gender"], section[aria-labelledby="gender"]',
    act: async (p) => {
      await p.setViewportSize({ width: 640, height: 900 })
      await p.waitForTimeout(500)
    },
  },
]
test('doc screenshots', async ({ page }) => {
  test.setTimeout(300_000)
  mkdirSync(docDir, { recursive: true })
  for (const s of SHOTS) {
    await page.setViewportSize({ width: s.width, height: 900 })
    await page.addInitScript((t) => localStorage.setItem('pico-theme', t), s.theme)
    await page.goto(s.route)
    await hydrated(page)
    await page.waitForLoadState('networkidle')
    await settle(page)
    if (await page.locator(s.target).count()) await page.locator(s.target).first().scrollIntoViewIfNeeded()
    const ok = await Promise.resolve(s.act?.(page)).then(() => true, (e) => console.log(s.name, String(e).slice(0, 200)))
    if (!ok) continue
    await page.waitForTimeout(200)
    await settle(page)
    const box = await page.locator(s.target).first().boundingBox({ timeout: 5000 }).catch(() => null)
    if (!box) continue
    const pad = s.pad ?? 8
    const vw = page.viewportSize()!.width
    await page.screenshot({ path: `${docDir}${label}-${s.name}.png`, clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(vw - Math.max(0, box.x - pad), box.width + 2 * pad), height: Math.min(700, box.height + 2 * pad) } })
  }
})
