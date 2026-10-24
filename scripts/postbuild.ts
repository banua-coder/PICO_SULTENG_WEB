/** After vite-ssg: 404/index.html becomes 404.html (nginx serves it with status 404), and the sitemap is written. */
import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { siteUrl } from '../src/app/site-url'
import { sitemapXml } from './site'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const nested = `${dist}404/index.html`
if (existsSync(nested)) {
  renameSync(nested, `${dist}404.html`)
  rmSync(`${dist}404`, { recursive: true, force: true })
}
writeFileSync(`${dist}sitemap.xml`, sitemapXml(siteUrl()))
console.log('postbuild: 404.html and sitemap.xml written')
