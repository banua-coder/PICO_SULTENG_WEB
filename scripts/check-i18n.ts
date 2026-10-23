/** Fails when a message key exists in one locale and not in the other (ADR-0102), is empty, or has other {placeholders}. */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

type Tree = { [k: string]: string | Tree }

export function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k
    return typeof v === 'string' ? { ...acc, [key]: v } : { ...acc, ...flatten(v, key) }
  }, {})
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort().join(',')

export function diffLocales(id: Tree, en: Tree): string[] {
  const a = flatten(id)
  const b = flatten(en)
  const out: string[] = []
  for (const k of Object.keys(a)) if (!(k in b)) out.push(`missing in en: ${k}`)
  for (const k of Object.keys(b)) if (!(k in a)) out.push(`missing in id: ${k}`)
  for (const [lang, m] of [['id', a], ['en', b]] as const) for (const [k, v] of Object.entries(m)) if (v.trim() === '') out.push(`empty in ${lang}: ${k}`)
  for (const k of Object.keys(a)) {
    if (k in b && placeholders(a[k]!) !== placeholders(b[k]!)) out.push(`placeholders differ at ${k}: id {${placeholders(a[k]!)}} vs en {${placeholders(b[k]!)}}`)
  }
  return out
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (l: string) => JSON.parse(readFileSync(fileURLToPath(new URL(`../src/locales/${l}.json`, import.meta.url)), 'utf8')) as Tree
  const problems = diffLocales(read('id'), read('en'))
  if (problems.length) {
    console.error(problems.join('\n') + '\nThe two locale files must have the same keys.')
    process.exit(1)
  }
  console.log('i18n keys ok')
}
