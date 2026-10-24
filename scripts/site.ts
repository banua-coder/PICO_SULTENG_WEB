import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { sitePairs } from '../src/app/siteRoutes'

// Pure helpers for postbuild and check-dist: the sitemap text, and reading the built site.

export function sitemapXml(site: string, pairs = sitePairs()): string {
  const alt = (l: string, p: string) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${site}${p}"/>`
  const url = (self: string, id: string, en: string) =>
    `  <url>\n    <loc>${site}${self}</loc>\n${alt('id', id)}\n${alt('en', en)}\n${alt('x-default', id)}\n  </url>`
  const urls = pairs.flatMap(([id, en]) => [url(id, id, en), url(en, id, en)])
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
}

/** dist file for a site path: '/data' -> data/index.html, '/' -> index.html, '/unduh/a.csv' -> unduh/a.csv */
export function fileForPath(dist: string, path: string): string {
  const clean = path.split(/[?#]/)[0]!.replace(/^\//, '').replace(/\/$/, '')
  if (/\.[a-z0-9]+$/i.test(clean)) return join(dist, clean)
  return join(dist, clean, 'index.html')
}

export function walkHtml(dist: string, dir = dist): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return n === 'assets' ? [] : walkHtml(dist, p)
    return n.endsWith('.html') ? [p] : []
  })
}

export const read = (f: string) => readFileSync(f, 'utf8')
export { existsSync }
