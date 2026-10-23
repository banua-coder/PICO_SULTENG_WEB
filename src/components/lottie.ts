// Dark-mode recolour for the brand Lottie files (brand/README.md): fills and strokes whose `nm` is one of
// these take the current theme's token value, so the animation follows light and dark.
export const LOTTIE_COLOURS: Record<string, string> = {
  'pico-primary': '--pico-primary',
  'pico-sky': '--pico-sky',
  'pico-indigo': '--pico-indigo',
  'pico-crimson': '--pico-crimson',
  'pico-tint': '--pico-tint',
}

/** A 6-digit hex string -> [r, g, b, 1] in 0..1. Returns null for anything that is not a 6-digit hex. */
export function hexToLottie(hex: string): [number, number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1]!, 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]
}

/** Recolours named fills and strokes in place. `readVar` returns the value of a CSS custom property. */
export function recolor(node: unknown, readVar: (name: string) => string): void {
  if (Array.isArray(node)) return node.forEach((n) => recolor(n, readVar))
  if (!node || typeof node !== 'object') return
  const o = node as { ty?: string; nm?: string; c?: { k?: unknown }; [k: string]: unknown }
  if ((o.ty === 'fl' || o.ty === 'st') && o.nm && LOTTIE_COLOURS[o.nm] && o.c) {
    const rgba = hexToLottie(readVar(LOTTIE_COLOURS[o.nm]!))
    if (rgba) o.c.k = rgba
  }
  Object.values(o).forEach((v) => recolor(v, readVar))
}
