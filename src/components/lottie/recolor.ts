// Brand v2 Lottie files name their colour shapes `pico-<slot>` (README of brand/v2). On a dark ground the light slot values are swapped for the
// dark ones before the animation loads. Skin and the logo blues are never recoloured; the logo has its own dark file.
const DARK: Record<string, string> = {
  'pico-blob': '#1e3a8a',
  'pico-paper': '#e5e7eb',
  'pico-line': '#9ca3af',
  'pico-muted': '#6b7280',
  'pico-ink': '#111827',
  'pico-blue': '#3b82f6',
  'pico-blue2': '#2563eb',
  'pico-sky': '#93c5fd',
  'pico-red': '#f87171',
  'pico-green': '#34d399',
  'pico-orange': '#fb923c',
}
const rgb = (hex: string): number[] => [1, 3, 5].map((i) => Math.round((parseInt(hex.slice(i, i + 2), 16) / 255) * 100) / 100)

/** A copy of the animation with the dark slot colours. Pure. */
export function recolorDark<T>(animation: T): T {
  const walk = (o: unknown): unknown => {
    if (Array.isArray(o)) return o.map(walk)
    if (o && typeof o === 'object') {
      const src = o as Record<string, unknown>
      const out = Object.fromEntries(Object.entries(src).map(([k, v]) => [k, walk(v)]))
      const dark = typeof src.nm === 'string' ? DARK[src.nm] : undefined
      const c = src.c as { k?: unknown; a?: number } | undefined
      if (dark && (src.ty === 'fl' || src.ty === 'st') && c && c.a === 0 && Array.isArray(c.k)) out.c = { ...c, k: [...rgb(dark), ...(c.k as number[]).slice(3)] }
      return out
    }
    return o
  }
  return walk(animation) as T
}
