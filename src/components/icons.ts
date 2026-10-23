import index from '@/assets/brand/icons/index.json'
import type { IconKey } from '@/assets/brand/icon-keys'

type IconEntry = { key: string; mono: string; duotone: string; aria: { id: string; en: string } }
const entries = index.icons as IconEntry[]

const mono = import.meta.glob<string>('@/assets/brand/icons/mono/*.svg', { query: '?raw', import: 'default', eager: true })
const duotone = import.meta.glob<string>('@/assets/brand/icons/duotone/*.svg', { query: '?raw', import: 'default', eager: true })

// Brand SVGs carry their own <svg> wrapper and <title>. We keep only the shapes and draw the wrapper in PicoIcon.
const inner = (raw: string) => raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<title>[\s\S]*?<\/title>/, '').replace(/<\/svg>\s*$/, '')

const byFile = (files: Record<string, string>, rel: string): string => {
  const hit = Object.entries(files).find(([path]) => path.endsWith(rel.split('/').pop()!))
  return hit ? inner(hit[1]) : ''
}

export function iconShapes(key: IconKey, variant: 'mono' | 'duotone'): string {
  const e = entries.find((i) => i.key === key)
  if (!e) return ''
  return variant === 'mono' ? byFile(mono, e.mono) : byFile(duotone, e.duotone)
}

export const iconLabel = (key: IconKey, locale: 'id' | 'en'): string => entries.find((i) => i.key === key)?.aria[locale] ?? key
