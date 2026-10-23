import index from '@/assets/brand/patterns/index.json'

// Kabupaten band patterns (DESIGN.md, brand/patterns). They are interpretations of Kaili motifs that still wait for a
// cultural review (pico-jlc.8), so the map only uses one, as the identity fill of the selected area, and only when
// VITE_MAP_BANDS=1. Off by default. The strips are loaded lazily and never ship with the page otherwise.
export const bandsEnabled = (): boolean => !!import.meta.env?.VITE_MAP_BANDS

const files = import.meta.glob<string>('@/assets/brand/patterns/band-*.svg', { query: '?raw', import: 'default' })
const fileOf = (name: string) => (index.kabupaten as { name: string; file: string }[]).find((k) => k.name === name)?.file

/** The shapes of a band strip and its size, for a <pattern>. Null when the area has no band. */
export async function loadBand(displayName: string): Promise<{ inner: string; w: number; h: number } | null> {
  const file = fileOf(displayName)
  const loader = file ? Object.entries(files).find(([p]) => p.endsWith(file))?.[1] : undefined
  if (!loader) return null
  const raw = await loader()
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(raw)
  if (!vb) return null
  return { inner: raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, ''), w: +vb[1]!, h: +vb[2]! }
}
