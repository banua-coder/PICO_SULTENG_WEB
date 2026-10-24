import { createRequire } from 'node:module'
const require = createRequire('/Users/ryanaidilp/Documents/Projects/Web/pico-port/package.json')
const { chromium } = require('@playwright/test')
const hex = (c) => { const m = c.match(/[\d.]+/g).map(Number); return '#' + m.slice(0, 3).map((x) => Math.round(x).toString(16).padStart(2, '0')).join('') + (m[3] !== undefined && m[3] < 1 ? ` (a=${m[3]})` : '') }
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } })
const out = {}
await p.goto('http://localhost:8099/', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
out.cards = await p.evaluate(() => [...document.querySelectorAll('h4.uppercase')].filter(h=>['POSITIF','DIRAWAT','SEMBUH','MENINGGAL'].includes(h.textContent.trim().toUpperCase())).map((h) => { const card = h.parentElement, cs = (e, k) => getComputedStyle(e)[k]
  const chip = card.querySelector('span.rounded-full'), num = card.querySelector('.text-2xl'), icon = chip.querySelector('i'), plain = card.querySelector('b')
  return { title: h.textContent.trim(), heading: cs(h, 'color'), headingSize: cs(h,'fontSize'), number: cs(num, 'color'), numberSize: cs(num,'fontSize'), chipBg: cs(chip, 'backgroundColor'), chipIcon: cs(icon, 'color'), region: cs(plain,'color'), cardBg: cs(card,'backgroundColor'), shadow: cs(card,'boxShadow'), radius: cs(card,'borderRadius') } }))
out.pageBg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor); out.font = await p.evaluate(() => getComputedStyle(document.body).fontFamily)
out.tabs = await p.evaluate(() => [...document.querySelectorAll('ul li a')].filter(a=>/Statistik|Vaksinasi/.test(a.textContent)).map(a=>({t:a.textContent.trim(),c:getComputedStyle(a).color,bb:getComputedStyle(a).borderBottomColor})))
out.nav = await p.evaluate(() => { const a=[...document.querySelectorAll('a')].find(a=>/Download App/.test(a.textContent)); const h=document.querySelector('header,nav'); return {btnBg:getComputedStyle(a).backgroundColor, btnColor:getComputedStyle(a).color, navBg:getComputedStyle(h).backgroundColor} })
out.suspect = await p.evaluate(() => { const h=[...document.querySelectorAll('h5')].find(h=>/PDP/.test(h.textContent)); return {title:getComputedStyle(h).color, border:getComputedStyle(h.parentElement).borderBottomColor} })
await p.locator('a', { hasText: /^\s*Vaksinasi\s*$/ }).first().click(); await p.waitForTimeout(1500)
const vacc = async () => p.evaluate(() => [...document.querySelectorAll('h4')].filter(h=>/Vaksinasi Dosis/.test(h.textContent)).map((h) => { const card = h.parentElement, cs=(e,k)=>getComputedStyle(e)[k]
  const bar = card.querySelector('.bg-gray-200'); return { title: h.textContent.trim(), titleColor: cs(h,'color'), big: cs(card.querySelector('.text-5xl'),'color'), barTrack: cs(bar,'backgroundColor'), segs: [...bar.children].map((s) => cs(s, 'backgroundColor')), labels: [...card.querySelectorAll('.justify-between')].slice(1).map((r) => ({ t: r.firstElementChild.textContent.trim(), c: cs(r, 'color') })) } }))
out.vaccineHome = await vacc()
await p.goto('http://localhost:8099/vaksin', { waitUntil: 'networkidle' }); await p.waitForTimeout(3000)
out.vaccinePage = await p.evaluate(() => { const cs=(e,k)=>getComputedStyle(e)[k]; return { targets: [...document.querySelectorAll('p.text-5xl')].slice(0,6).map(e=>({t:e.textContent.trim(),c:cs(e,'color')})), progress: [...document.querySelectorAll('.h-8.bg-gray-200')].map(bar=>{const card=bar.closest('.shadow-lg'); return {title:card.querySelector('h4').textContent.trim(), fill:[...bar.children].map(s=>cs(s,'backgroundColor')), num:cs(card.querySelector('.text-5xl'),'color')}}) } })
await b.close()
const conv = (o) => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'string' && /^rgba?\(/.test(v) && !/shadow/i.test(k) ? hex(v) : v))
console.log(JSON.stringify(conv(out), null, 1))
