// @vitest-environment node
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// reka-ui's Select renders one fixed <style> element (scrollbar hiding). The CSP has no 'unsafe-inline' for styles, so nginx.conf lists the
// hash of that text. If reka-ui is upgraded and the text changes, this test says which hash to put in deploy/nginx.conf and docs/deploy.md.
const root = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url))

describe('CSP style hash for reka-ui Select', () => {
  const src = readFileSync(root('node_modules/reka-ui/dist/Select/SelectViewport.js'), 'utf8')
  const text = src.match(/createTextVNode\("( \/\* Hide scrollbars[^"]*)"/)?.[1]
  const hash = text ? `'sha256-${createHash('sha256').update(text).digest('base64')}'` : ''

  it('finds the style text in the installed reka-ui', () => expect(text).toBeTruthy())
  it('is in the style-src of deploy/nginx.conf and in docs/deploy.md', () => {
    for (const f of ['deploy/nginx.conf', 'docs/deploy.md']) {
      const line = readFileSync(root(f), 'utf8').split('\n').find((l) => l.includes('style-src \'self\''))!
      expect(line, `${f} needs ${hash}`).toContain(`style-src 'self' ${hash};`)
    }
  })
})
