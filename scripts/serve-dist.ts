/**
 * Static server for dist/ that routes like the production nginx will (ADR-0104, contract C5), for e2e:
 *   /data/provinsi/aceh -> data/provinsi/aceh/index.html     unknown path -> 404.html with status 404
 *   /data/ -> 301 /data   (Beranda keeps / and /en/)         /id/data -> 301 /data
 * `vite preview` serves the root index.html for every path, which hides prerender and hydration bugs.
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.csv': 'text/csv; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
}

export function resolveRequest(dist: string, rawPath: string): { redirect?: string; file?: string; status: number } {
  const path = decodeURIComponent(rawPath)
  if (path.startsWith('/id/') || path === '/id') return { redirect: path.replace(/^\/id/, '') || '/', status: 301 }
  if (path.length > 1 && path.endsWith('/') && path !== '/en/') return { redirect: path.replace(/\/+$/, ''), status: 301 }
  const rel = normalize(path).replace(/^(\.\.[/\\])+/, '')
  const direct = join(dist, rel)
  if (extname(rel) && existsSync(direct) && statSync(direct).isFile()) return { file: direct, status: 200 }
  const index = join(dist, rel, 'index.html')
  if (!extname(rel) && existsSync(index)) return { file: index, status: 200 }
  return { file: join(dist, '404.html'), status: 404 }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  const port = Number(process.argv[2] ?? 4173)
  createServer((req, res) => {
    const r = resolveRequest(dist, new URL(req.url ?? '/', 'http://x').pathname)
    if (r.redirect) {
      res.writeHead(301, { Location: r.redirect })
      return res.end()
    }
    const body = readFileSync(r.file!)
    res.writeHead(r.status, { 'Content-Type': MIME[extname(r.file!)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(body)
  }).listen(port, () => console.log(`serving dist/ on http://localhost:${port}`))
}
