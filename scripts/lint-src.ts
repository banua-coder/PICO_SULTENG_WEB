/**
 * Token lint (ADR-0097, spec 12): no raw colour in src/ outside src/assets/brand/.
 * Catches hex values, rgb()/hsl()/oklch() literals, and arbitrary colour utilities such as bg-[#fff].
 * Colour comes from var(--pico-*) or a theme class.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const RULES: [string, RegExp][] = [
  ['hex colour', /(?<![&\w])(?<!url\()#[0-9a-fA-F]{3,8}\b/],
  ['rgb/hsl/oklch literal', /\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/],
  ['arbitrary colour class', /\b(?:bg|text|border|fill|stroke|ring|outline|from|via|to|decoration|accent|caret)-\[(?:#|rgb|hsl|oklch|color)/],
]

export function findRawColours(file: string, text: string): string[] {
  return text.split('\n').flatMap((line, i) =>
    RULES.filter(([, re]) => re.test(line)).map(([name]) => `${file}:${i + 1}: ${name}: ${line.trim().slice(0, 80)}`),
  )
}

const SKIP_DIR = /(^|\/)(assets\/brand|node_modules)(\/|$)|styles\/palette(-[a-z]+)?\.css$/
const CHECKED = /\.(vue|ts|css)$/
const SKIP_FILE = /\.test\.ts$/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const problems = walk(join(root, 'src'))
    .filter((f) => !SKIP_DIR.test(relative(root, f)) && CHECKED.test(f) && !SKIP_FILE.test(f))
    .flatMap((f) => findRawColours(relative(root, f), readFileSync(f, 'utf8')))
  if (problems.length) {
    console.error(problems.join('\n') + '\nUse var(--pico-*) or a theme class. New colours start in the PICO brand tokens.')
    process.exit(1)
  }
  console.log('token lint ok')
}
