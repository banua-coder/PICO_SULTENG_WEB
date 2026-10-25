import type { Page } from '@playwright/test'

/**
 * A computed-style contrast scan (docs/contrast-audit.md). It complements axe: axe skips SVG text, SVG graphics, text over shapes,
 * placeholders and form-control boundaries, and reports "incomplete" for anything over a gradient. This walks the DOM in the page and
 * resolves each pair itself:
 * - text (HTML and SVG): colour times the opacity of every ancestor, over the composited background of the element and its ancestors.
 *   SVG text sits over the topmost shape painted before it at the text centre (a map area, a bar), or over its own halo
 *   (paint-order: stroke). A gradient background gives one pair per stop, the worst one counts.
 * - graphics (WCAG 1.4.11, 3:1): every SVG shape outside <defs> with a stroke or fill, and lucide icons (currentColor), against the
 *   background of their SVG. One entry per distinct colour pair.
 * - control boundaries (1.4.11): inputs, selects, comboboxes, switches, checkboxes: fill or border must reach 3:1 against the ground.
 * - placeholders (1.4.3, 4.5:1).
 * Disabled controls are reported with `exempt` (WCAG 1.4.3 and 1.4.11 exempt inactive components). A graphic whose information is also
 * given another way carries `data-contrast-alt="<how>"` in the source (a legacy fill with its value printed, a decorative gridline): it is
 * reported with `exempt: 'alt: <how>'`, so every such graphic is named in the code and listed in docs/contrast-audit.md. Text never is.
 * Colours are normalised through a 2D canvas, so oklch, color-mix and color(srgb) values all resolve.
 */
export type Pair = {
  kind: 'text' | 'graphic' | 'control' | 'placeholder' | 'focus'
  selector: string
  sample: string
  fg: string
  bg: string
  ratio: number
  need: number
  exempt?: string
  note?: string
  box: [number, number, number, number]
}

export type ScanOptions = { scope?: string; all?: boolean }

export const scanContrast = (page: Page, opts: ScanOptions = {}): Promise<Pair[]> => page.evaluate(walk, opts)

/** The focus ring of the focused element against what is next to it (the ground of its parent), 3:1. Null when nothing is focused. */
export const focusRing = (page: Page): Promise<Pair | null> => page.evaluate(walk, { focus: true }).then((r) => r[0] ?? null)

export const fails = (pairs: Pair[]) => pairs.filter((p) => !p.exempt && p.ratio < p.need)

export const describePair = (p: Pair) => `${p.kind} ${p.selector} "${p.sample}" ${p.fg} on ${p.bg} = ${p.ratio.toFixed(2)} (needs ${p.need})${p.note ? ` [${p.note}]` : ''}`

// Runs in the page: everything it needs is inside.
function walk(opts: ScanOptions & { focus?: boolean }): Pair[] {
  type RGBA = [number, number, number, number]
  const cv = document.createElement('canvas')
  cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })!
  const memo = new Map<string, RGBA | null>()
  const parse = (s: string | null | undefined): RGBA | null => {
    if (!s || s === 'none' || s.startsWith('url(')) return null
    if (s === 'transparent') return [0, 0, 0, 0]
    if (memo.has(s)) return memo.get(s)!
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = '#010203'
    ctx.fillStyle = s
    const ok = ctx.fillStyle !== '#010203' || s.replace(/\s/g, '') === '#010203'
    ctx.fillRect(0, 0, 1, 1)
    const d = ctx.getImageData(0, 0, 1, 1).data
    const c: RGBA | null = ok ? [d[0]!, d[1]!, d[2]!, d[3]! / 255] : null
    memo.set(s, c)
    return c
  }
  const over = (top: RGBA, bottom: RGBA): RGBA => {
    const a = top[3]
    return [top[0] * a + bottom[0] * (1 - a), top[1] * a + bottom[1] * (1 - a), top[2] * a + bottom[2] * (1 - a), 1]
  }
  const lin = (v: number) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const lum = (c: RGBA) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  const ratio = (a: RGBA, b: RGBA) => {
    const [x, y] = [lum(a), lum(b)]
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }
  const hex = (c: RGBA) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

  const opac = new WeakMap<Element, number>()
  const opacityOf = (el: Element | null): number => {
    if (!el) return 1
    if (opac.has(el)) return opac.get(el)!
    const v = Number(getComputedStyle(el).opacity) * opacityOf(el.parentElement)
    opac.set(el, v)
    return v
  }
  const pattern = (url: string): RGBA | null => {
    const id = url.match(/url\("?#([^")]+)"?\)/)?.[1]
    const p = id ? document.getElementById(id) : null
    const r = p?.querySelector('rect,path')
    return r ? parse(getComputedStyle(r).fill) : null
  }

  /** The grounds behind an element: one per gradient stop (one when there is no gradient). */
  const groundsOf = (el: Element | null): { grounds: RGBA[]; note?: string } => {
    const layers: RGBA[][] = []
    let note: string | undefined
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n)
      const img = cs.backgroundImage
      if (img && img !== 'none') {
        const stops = [...img.matchAll(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|oklab\([^)]*\)|#[0-9a-f]{3,8})/gi)].map((m) => parse(m[1]!)).filter((c): c is RGBA => !!c)
        if (img.includes('url(')) note = 'background image'
        if (stops.length) {
          const o = opacityOf(n)
          layers.push(stops.map((s) => [s[0], s[1], s[2], s[3] * o] as RGBA))
          note = 'gradient'
          if (stops.every((s) => s[3] === 1)) break
        }
      }
      const bg = parse(cs.backgroundColor)
      if (bg && bg[3] > 0) {
        const o = opacityOf(n)
        layers.push([[bg[0], bg[1], bg[2], bg[3] * o]])
        if (bg[3] === 1 && o === 1) break
      }
    }
    let grounds: RGBA[] = [[255, 255, 255, 1]]
    for (const l of layers.reverse()) grounds = grounds.flatMap((g) => l.map((c) => over(c, g)))
    return { grounds, note }
  }

  const sel = (el: Element) => {
    const parts: string[] = []
    for (let n: Element | null = el, i = 0; n && i < 4 && n !== document.body; n = n.parentElement, i++) {
      let s = n.tagName.toLowerCase()
      if (n.id && !/^(v|reka)-/.test(n.id)) s += `#${n.id}`
      const data = [...n.attributes].find((a) => a.name.startsWith('data-') && !/data-v-|data-state|data-hydrated/.test(a.name))
      if (data) s += `[${data.name}${data.value && data.value.length < 24 ? `="${data.value}"` : ''}]`
      const cls = [...n.classList].filter((c) => !c.includes(':') && !c.includes('[')).slice(0, 2)
      if (cls.length) s += '.' + cls.join('.')
      parts.unshift(s)
    }
    return parts.join(' > ')
  }
  const boxOf = (r: DOMRect): Pair['box'] => [Math.round(r.x + scrollX), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)]
  const exemptOf = (el: Element) => (el.closest(':disabled,[aria-disabled="true"],[data-disabled]') ? 'disabled' : undefined)
  const out: Pair[] = []
  const pairOf = (p: Omit<Pair, 'ratio' | 'fg' | 'bg'>, fg: RGBA, grounds: RGBA[]): Pair => {
    let worst = Infinity
    let wg = grounds[0]!
    for (const g of grounds) {
      const r = ratio(over(fg, g), g)
      if (r < worst) [worst, wg] = [r, g]
    }
    return { ...p, fg: fg[3] < 1 ? `${hex(fg)} @${fg[3].toFixed(2)}` : hex(fg), bg: hex(wg), ratio: Math.round(worst * 100) / 100 }
  }
  const push = (p: Omit<Pair, 'ratio' | 'fg' | 'bg'>, fg: RGBA, grounds: RGBA[]) => out.push(pairOf(p, fg, grounds))
  const textOf = (el: Element) => el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) ?? ''

  // ---- the focus ring only ----
  if (opts.focus) {
    const el = document.activeElement
    if (!el || el === document.body) return []
    const cs = getComputedStyle(el)
    const base = { kind: 'focus' as const, selector: sel(el), sample: textOf(el), need: 3, box: boxOf(el.getBoundingClientRect()) }
    const { grounds } = groundsOf(el.parentElement)
    if (cs.outlineStyle === 'none' || parseFloat(cs.outlineWidth) === 0) {
      const ring = cs.boxShadow.match(/(rgba?\([^)]*\))[^,]*\b0px 0px 0px (\d+(\.\d+)?)px/)
      if (ring) push({ ...base, note: 'box-shadow ring' }, parse(ring[1])!, grounds)
      else out.push({ ...base, fg: 'none', bg: hex(grounds[0]!), ratio: 1, note: 'no visible focus indicator' })
    } else push({ ...base, note: `outline ${cs.outlineWidth} ${cs.outlineStyle}` }, parse(cs.outlineColor)!, grounds)
    return out
  }

  const root = opts.scope ? document.querySelector(opts.scope) : document.body
  if (!root) return []
  const visible = (el: Element) => el.checkVisibility({ opacityProperty: true, visibilityProperty: true })

  // ---- text ----
  const seen = new Set<Element>()
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let t = tw.nextNode(); t; t = tw.nextNode()) {
    const el = t.parentElement
    if (!el || seen.has(el) || !t.textContent?.trim() || el.closest('script,style,noscript,title,defs')) continue
    seen.add(el)
    if (!visible(el)) continue
    const range = document.createRange()
    range.selectNodeContents(t)
    const r = range.getBoundingClientRect()
    if (r.width <= 1 || r.height <= 1) continue
    // clipped away (sr-only and visually hidden patterns)
    let clipped = false
    for (let n: Element | null = el; n && !clipped; n = n.parentElement) {
      const c = getComputedStyle(n)
      if ((c.overflow === 'hidden' || c.clip !== 'auto') && n.getBoundingClientRect().width <= 1) clipped = true
    }
    if (clipped) continue
    const cs = getComputedStyle(el)
    const px = parseFloat(cs.fontSize)
    const bold = Number(cs.fontWeight) >= 700
    const large = px >= 24 || (px >= 18.66 && bold)
    const base = { kind: 'text' as const, selector: sel(el), sample: t.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), need: large ? 3 : 4.5, exempt: exemptOf(el), box: boxOf(r) }
    const o = opacityOf(el)
    if (el instanceof SVGElement) {
      const fill = parse(cs.fill) ?? pattern(cs.fill)
      if (!fill) continue
      const fg: RGBA = [fill[0], fill[1], fill[2], fill[3] * Number(cs.fillOpacity) * o]
      const svg = el.ownerSVGElement!
      let { grounds, note } = groundsOf(svg)
      const halo = parse(cs.stroke)
      if (halo && cs.paintOrder.startsWith('stroke') && parseFloat(cs.strokeWidth) >= 2) {
        grounds = grounds.map((g) => over([halo[0], halo[1], halo[2], halo[3] * Number(cs.strokeOpacity) * o], g))
        note = 'over its halo'
      } else {
        // the topmost shape painted before the text, under its centre
        const cx = r.x + r.width / 2
        const cy = r.y + r.height / 2
        const shapes = [...svg.querySelectorAll('path,rect,circle,ellipse,polygon')].filter(
          (s) => !s.closest('defs,pattern,clipPath,mask,marker,symbol') && s.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING,
        ) as SVGGeometryElement[]
        for (let i = shapes.length - 1; i >= 0; i--) {
          const s = shapes[i]!
          const sc = getComputedStyle(s)
          const f = parse(sc.fill) ?? pattern(sc.fill)
          if (!f || f[3] === 0 || !visible(s)) continue
          const m = s.getScreenCTM()
          if (!m) continue
          const p = new DOMPoint(cx, cy).matrixTransform(m.inverse())
          if (s.isPointInFill(p)) {
            const fo = Number(sc.fillOpacity) * opacityOf(s)
            grounds = grounds.map((g) => over([f[0], f[1], f[2], f[3] * fo], g))
            note = `over ${sel(s).split(' > ').pop()}`
            break
          }
        }
      }
      push({ ...base, note }, fg, grounds)
    } else {
      const c = parse(cs.color)
      if (!c) continue
      const { grounds, note } = groundsOf(el)
      push({ ...base, note }, [c[0], c[1], c[2], c[3] * o], grounds)
    }
  }

  // ---- graphics: one entry per distinct pair ----
  const graphicPairs = new Map<string, Pair>()
  const addGraphic = (el: Element, fg: RGBA, grounds: RGBA[], note: string) => {
    const alt = el.closest('[data-contrast-alt]')?.getAttribute('data-contrast-alt')
    const exempt = exemptOf(el) ?? (alt ? `alt: ${alt}` : undefined)
    const p = pairOf({ kind: 'graphic', selector: sel(el), sample: textOf(el.closest('button,a,[role],figure') ?? el), need: 3, exempt, note, box: boxOf(el.getBoundingClientRect()) }, fg, grounds)
    const key = `${note}|${p.fg}|${p.bg}`
    if (!graphicPairs.has(key)) graphicPairs.set(key, p)
  }
  for (const svg of [...(root instanceof SVGSVGElement ? [root] : []), ...root.querySelectorAll('svg')]) {
    if (!visible(svg) || svg.getBoundingClientRect().width < 2) continue
    const { grounds } = groundsOf(svg)
    if (svg.classList.contains('lucide') || svg.getAttribute('stroke') === 'currentColor') {
      const c = parse(getComputedStyle(svg).color)
      if (c) addGraphic(svg, [c[0], c[1], c[2], c[3] * opacityOf(svg)], grounds, 'icon')
      continue
    }
    for (const s of svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline,line')) {
      if (s.closest('defs,pattern,clipPath,mask,marker,symbol') || !visible(s)) continue
      const b = s.getBoundingClientRect()
      if (b.width + b.height < 2) continue
      const sc = getComputedStyle(s)
      const o = opacityOf(s)
      const role = s.closest('[data-role]')?.getAttribute('data-role') ?? s.closest('[data-step]')?.getAttribute('data-step') ?? ''
      const tag = [...s.attributes].find((a) => a.name.startsWith('data-') && !a.name.startsWith('data-v-'))?.name.replace('data-', '') ?? s.tagName
      const stroke = parse(sc.stroke)
      if (stroke && stroke[3] > 0 && parseFloat(sc.strokeWidth) > 0) addGraphic(s, [stroke[0], stroke[1], stroke[2], stroke[3] * Number(sc.strokeOpacity) * o], grounds, `stroke ${tag} ${role}`.trim())
      const fill = s.tagName === 'line' ? null : (parse(sc.fill) ?? pattern(sc.fill))
      if (fill && fill[3] > 0) addGraphic(s, [fill[0], fill[1], fill[2], fill[3] * Number(sc.fillOpacity) * o], grounds, `fill ${tag} ${role}`.trim())
    }
  }
  out.push(...graphicPairs.values())

  // ---- control boundaries and placeholders ----
  for (const el of root.querySelectorAll('input:not([type=hidden]),select,textarea,[role=combobox],[role=switch],[role=checkbox],[role=radio]')) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2) continue
    const cs = getComputedStyle(el)
    const { grounds } = groundsOf(el.parentElement)
    const own = parse(cs.backgroundColor)
    const border = parse(cs.borderTopColor)
    const bw = parseFloat(cs.borderTopWidth)
    const base = { kind: 'control' as const, selector: sel(el), sample: (el.getAttribute('aria-label') ?? textOf(el)).slice(0, 40), need: 3, exempt: exemptOf(el), box: boxOf(r) }
    const fillPair = own && own[3] > 0 ? Math.min(...grounds.map((g) => ratio(over(own, g), g))) : 1
    if (fillPair >= 3 || !border || bw === 0) push({ ...base, note: 'fill' }, own ?? [0, 0, 0, 0], grounds)
    else push({ ...base, note: `border ${cs.borderTopWidth}` }, border, grounds)
    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.placeholder && !el.value) {
      const ph = parse(getComputedStyle(el, '::placeholder').color)
      const { grounds: g2 } = groundsOf(el)
      if (ph) push({ kind: 'placeholder', selector: sel(el), sample: el.placeholder.slice(0, 40), need: 4.5, exempt: exemptOf(el), box: boxOf(r) }, ph, g2)
    }
  }

  return opts.all ? out : out.filter((p) => !p.exempt && p.ratio < p.need)
}
