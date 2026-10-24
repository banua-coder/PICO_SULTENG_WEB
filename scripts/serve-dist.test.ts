// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveRequest } from './serve-dist'

const dist = mkdtempSync(join(tmpdir(), 'serve-'))
for (const f of ['index.html', 'en/index.html', 'data/index.html', 'data/provinsi/aceh/index.html', '404.html', 'assets/a.js', 'unduh/x.csv']) {
  mkdirSync(dirname(join(dist, f)), { recursive: true })
  writeFileSync(join(dist, f), 'x')
}

describe('resolveRequest', () => {
  it('maps a route to its prerendered index.html', () => {
    expect(resolveRequest(dist, '/data/provinsi/aceh')).toEqual({ file: join(dist, 'data/provinsi/aceh/index.html'), status: 200 })
    expect(resolveRequest(dist, '/')).toEqual({ file: join(dist, 'index.html'), status: 200 })
    expect(resolveRequest(dist, '/en/')).toEqual({ file: join(dist, 'en/index.html'), status: 200 })
  })
  it('serves files as they are', () => {
    expect(resolveRequest(dist, '/assets/a.js').file).toBe(join(dist, 'assets/a.js'))
    expect(resolveRequest(dist, '/unduh/x.csv').status).toBe(200)
  })
  it('unknown paths get 404.html with status 404, never the SPA shell', () => {
    expect(resolveRequest(dist, '/nope')).toEqual({ file: join(dist, '404.html'), status: 404 })
    expect(resolveRequest(dist, '/data/provinsi/atlantis').status).toBe(404)
    expect(resolveRequest(dist, '/../etc/passwd').status).toBe(404)
  })
  it('a trailing slash and the /id prefix redirect with 301 (C5)', () => {
    expect(resolveRequest(dist, '/data/')).toEqual({ redirect: '/data', status: 301 })
    expect(resolveRequest(dist, '/id/data')).toEqual({ redirect: '/data', status: 301 })
    expect(resolveRequest(dist, '/en/')).not.toHaveProperty('redirect')
  })
})
