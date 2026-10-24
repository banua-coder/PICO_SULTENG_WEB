import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'

// A small stand-in for `cn` + tailwind-merge (the merge library is 14 KB gzipped, and this site's first load is budgeted).
// Later classes win over earlier ones of the same group and the same variants (`md:`, `hover:`): `cn('px-5', 'px-3')` is `px-3`.
// Only the groups the shadcn-vue components and this site override are known; any other class is only de-duplicated.
const SIZES = new Set(['xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl', '3xl'])
const SPACING = ['gap-x', 'gap-y', 'gap', 'min-h', 'min-w', 'max-h', 'max-w', 'size', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'ps', 'pe', 'p', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'ms', 'me', 'm', 'w', 'h']
const DISPLAY = new Set(['flex', 'grid', 'block', 'inline', 'inline-flex', 'inline-block', 'hidden', 'contents', 'inline-grid'])
// utilities that are one property with a keyword value: the last one wins
const KEYWORD = ['justify', 'items', 'self', 'content', 'overflow-x', 'overflow-y', 'overflow', 'whitespace', 'leading', 'tracking', 'opacity', 'z', 'cursor', 'position', 'underline']
const WEIGHTS = new Set(['regular', 'medium', 'semibold', 'strong', 'heading', 'bold', 'normal', 'light'])

function group(utility: string): string {
  if (DISPLAY.has(utility)) return 'display'
  const neg = utility.startsWith('-') ? '-' : ''
  const u = neg ? utility.slice(1) : utility
  for (const p of SPACING) if (u.startsWith(`${p}-`)) return `${neg}${p}`
  if (u === 'rounded' || u.startsWith('rounded-')) {
    const rest = u.slice(7)
    return SIZES.has(rest) || rest === 'none' || rest === 'full' || rest === '' ? 'rounded' : `rounded-${rest.split('-')[0]}`
  }
  if (u.startsWith('text-')) {
    const rest = u.slice(5)
    if (SIZES.has(rest)) return 'text-size'
    if (['left', 'center', 'right', 'start', 'end', 'balance', 'wrap', 'nowrap'].includes(rest)) return `text-${rest === 'balance' || rest.includes('wrap') ? 'wrap' : 'align'}`
    return 'text-color'
  }
  if (u.startsWith('font-')) return WEIGHTS.has(u.slice(5)) ? 'font-weight' : 'font-family'
  for (const k of KEYWORD) if (u.startsWith(`${k}-`)) return k
  if (u.startsWith('shadow')) return 'shadow'
  if (u.startsWith('bg-')) return 'bg'
  if (u === 'border' || /^border-\d+$/.test(u)) return 'border-width'
  if (u.startsWith('border-') && !/^border-[trblxy]-?/.test(u)) return 'border-color'
  return utility // anything else: only an exact repeat is merged
}

export function cn(...inputs: ClassValue[]): string {
  const seen = new Map<string, string>()
  for (const cls of clsx(inputs).split(/\s+/).filter(Boolean)) {
    const at = cls.lastIndexOf(':')
    const variants = cls.slice(0, at + 1)
    const important = cls.slice(at + 1).startsWith('!') ? '!' : ''
    const utility = cls.slice(at + 1 + important.length)
    const key = `${variants}${important}${group(utility)}`
    seen.delete(key) // a later class moves to the end, so the order of what remains is the order written
    seen.set(key, cls)
  }
  return [...seen.values()].join(' ')
}
export type { ClassValue }
