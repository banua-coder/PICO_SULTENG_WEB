import { createRequire } from 'node:module'
import fs from 'node:fs'
const require = createRequire('/Users/ryanaidilp/Documents/Projects/Web/pico-port/package.json')
const { chromium } = require('@playwright/test')
const OUT = process.env.OUT || '/Users/ryanaidilp/Documents/Projects/Web/pico-port/docs/legacy-screens'
const BASE = 'http://localhost:8099'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch()
const sleep = (p, ms = 1200) => p.waitForTimeout(ms)
async function open(p, path, wait = 3500) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' }); await sleep(p, wait)
  // scroll through to trigger v-lazy images, then back to top
  const h = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120) }
  await p.evaluate(() => window.scrollTo(0, 0)); await sleep(p, 800)
}
async function pick(p, root, nth, text) { // vue-select nth within root
  await root.locator('.vs__dropdown-toggle').nth(nth).click(); await p.waitForTimeout(300)
  await root.locator('li.vs__dropdown-option', { hasText: new RegExp('^\\s*' + text + '\\s*$') }).first().click(); await sleep(p, 2500)
}
for (const w of [1280, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 360 ? 800 : 900 }, deviceScaleFactor: 1, colorScheme: 'light' })
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 150)))
  const full = (n) => p.screenshot({ path: `${OUT}/${n}-${w}.png`, fullPage: true })
  const el = async (loc, n) => { await loc.scrollIntoViewIfNeeded(); await sleep(p, 600); await p.mouse.move(2, 2); await loc.screenshot({ path: `${OUT}/${n}-${w}.png` }) }

  await open(p, '/'); await full('home')
  await p.locator('a', { hasText: /^\s*Vaksinasi\s*$/ }).first().click(); await sleep(p, 1500); await full('home-vaksinasi')

  await open(p, '/data', 5000); await full('data')
  const sec = (t) => p.locator('section', { hasText: t }).last()
  const mapSec = p.locator('section', { hasText: 'Peta Penyebaran Kasus' }).first()
  // legacy quirk: map is only coloured after a selector changes (Map.vue has no watcher on `data`) -> toggle case
  await pick(p, mapSec, 1, 'Sembuh'); await pick(p, mapSec, 1, 'Positif')
  await el(mapSec, 'data-map-sulteng')
  await pick(p, mapSec, 0, 'Indonesia'); await pick(p, mapSec, 1, 'Sembuh'); await pick(p, mapSec, 1, 'Positif') // legacy bug: ranges use stale keys right after a region switch
  await el(mapSec, 'data-map-indonesia')
  await pick(p, mapSec, 0, 'Sulawesi Tengah'); await pick(p, mapSec, 2, 'Titik'); await el(mapSec, 'data-map-titik')
  const chSec = p.locator('section', { hasText: 'Visualisasi Data Kasus COVID-19' }).first()
  await el(chSec, 'data-chart-harian')
  await chSec.locator('a', { hasText: 'Kasus Kumulatif' }).click(); await sleep(p, 2500); await el(chSec, 'data-chart-kumulatif')
  const rt = p.locator('section', { hasText: 'Estimating COVID-19' }).first()
  await el(rt, 'data-rt')
  if (w === 1280) {
    const c = rt.locator('canvas').first(); const bb = await c.boundingBox()
    await p.mouse.move(bb.x + bb.width * 0.4, bb.y + bb.height * 0.5)
    for (let i = 0; i < 6; i++) { await p.mouse.wheel(0, -400); await p.waitForTimeout(250) }
    await sleep(p, 800); await el(rt, 'data-rt-zoomed')
    await rt.locator('button', { hasText: 'Reset Zoom' }).click(); await sleep(p, 900); await el(rt, 'data-rt-reset')
  }
  await open(p, '/vaksin'); await full('vaksin')
  await open(p, '/tabel-data', 5000); await full('tabel')
  await open(p, '/isoman'); await full('isoman')
  await open(p, '/kontak'); await full('kontak')
  await open(p, '/wiki'); await full('wiki')
  await open(p, '/infografis'); await full('infografis')
  console.log(w, 'page errors:', [...new Set(errs)])
  await ctx.close()
}
await b.close()
