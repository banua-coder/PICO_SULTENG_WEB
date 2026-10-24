// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile } from '@tailwindcss/node'
import { describe, expect, it } from 'vitest'

const stylesDir = fileURLToPath(new URL('.', import.meta.url))
const tokens = readFileSync(`${stylesDir}../assets/brand/pico-tokens.css`, 'utf8')
const theme = readFileSync(`${stylesDir}theme.css`, 'utf8')
const palette = readFileSync(`${stylesDir}palette.css`, 'utf8')

async function css(candidates: string[]) {
  const input = `@import 'tailwindcss';\n@import './theme.css';`
  const compiler = await compile(input, { base: stylesDir, onDependency: () => {} })
  return compiler.build(candidates)
}

describe('theme.css (ADR-0097)', () => {
  it('references only tokens that pico-tokens.css or palette.css declares', () => {
    const declared = new Set([...tokens.matchAll(/(--pico-[a-z0-9-]+)\s*:/g), ...palette.matchAll(/(--pico-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
    const used = [...theme.matchAll(/var\((--pico-[a-z0-9-]+)\)/g)].map((m) => m[1]!)
    expect(used.length).toBeGreaterThan(40)
    expect(used.filter((v) => !declared.has(v))).toEqual([])
  })

  it('has no raw colour value of its own', () => {
    expect(theme).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/)
  })

  it('generates brand classes', async () => {
    const out = await css(['bg-paper', 'text-ink', 'text-primary-strong', 'bg-card', 'text-muted-foreground', 'p-5', 'rounded-md', 'font-display', 'text-xl', 'gap-3'])
    expect(out).toContain('var(--pico-paper)')
    expect(out).toContain('var(--pico-ink)')
    expect(out).toContain('var(--pico-surface)') // shadcn `card`
    expect(out).toContain('var(--pico-ink-muted)') // shadcn `muted-foreground`
    expect(out).toContain('--spacing') // the default Tailwind scale is back (shadcn-vue needs it)
    expect(out).toContain('var(--pico-radius-md)')
    expect(out).toContain('var(--pico-font-display)')
    expect(out).toContain('var(--pico-text-xl)')
  })

  it('does not generate raw colour classes', async () => {
    const off = ['bg-red-500', 'text-blue-600', 'bg-white', 'text-black', 'border-gray-200', 'text-4xl']
    const out = await css(off)
    for (const c of off) expect(out, c).not.toContain(`.${c.replace('.', '\\.')}`)
  })
})
