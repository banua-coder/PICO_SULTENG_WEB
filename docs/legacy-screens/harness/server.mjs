// Static harness for the legacy PICO Sulteng (Laravel+Inertia+Vue2) compiled bundle.
// usage: PUBLIC=/tmp/legacy-site/public PORT=8099 node server.mjs   (needs mock.json from build-mock.mjs)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
const PUBLIC = process.env.PUBLIC || '/tmp/legacy-site/public'
const PORT = +(process.env.PORT || 8099)
const HERE = path.dirname(new URL(import.meta.url).pathname)
const mock = JSON.parse(fs.readFileSync(path.join(HERE, 'mock.json'), 'utf8'))
const ROUTES = { home: '', contact: '/kontak', wiki: '/wiki', data: '/data', infographic: '/infografis', table: '/tabel-data', vaccine: '/vaksin', 'self-isolation': '/isoman' }
const MIME = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon' }
const A = 'https://cdn.anychart.com/releases/8.7.1'

const html = (page) => `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/assets/images/logo.png" type="image/x-icon" /><title>PICO Sulteng</title>
<link rel="stylesheet" href="/css/app.css">
<script src="${A}/js/anychart-exports.min.js" async></script>
<script src="${A}/js/anychart-ui.min.js"></script>
<link rel="stylesheet" type="text/css" href="${A}/css/anychart-ui.min.css" />
<link rel="stylesheet" type="text/css" href="${A}/fonts/css/anychart-font.min.css" />
<script>const __r=${JSON.stringify(ROUTES)};window.route=function(n){return n===undefined?{current:()=>false}:(__r[n]??'')}</script>
<script src="/js/app.js" defer></script></head>
<body class="flex flex-col"><div id="app" data-page='${JSON.stringify(page).replace(/&/g, '&amp;').replace(/'/g, '&#039;')}'></div></body></html>`

const apiGet = (p, q) => {
  const a = mock.api
  if (p === 'statistics') return q.has('province') ? a['statistics?province'] : a.statistics
  if (p === 'statistics/latest') return q.has('province') ? a['statistics/latest?province'] : a['statistics/latest']
  if (p === 'vaccine/latest') return q.has('province') ? a['vaccine/latest?province'] : a['vaccine/latest']
  if (p.startsWith('regencies/all')) return a['regencies/all']
  if (p === 'hospitals') return mock.pages['/kontak'][1].hospitals
  if (p === 'task_forces') return mock.pages['/kontak'][1].taskForces
  return a[p] ?? []
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  const send = (code, type, body, h = {}) => { res.writeHead(code, { 'content-type': type, ...h }); res.end(body) }
  if (u.pathname.startsWith('/corona/api/v1/')) {
    return send(200, 'application/json', JSON.stringify({ status: 'success', data: apiGet(u.pathname.slice('/corona/api/v1/'.length), u.searchParams) }))
  }
  if (u.pathname.startsWith('/ph/')) { // placeholder art for the dead banner/infographic hosts
    const t = u.searchParams.get('t') || '', ban = u.pathname === '/ph/banner', W = ban ? 800 : 600, H = ban ? 400 : 600
    const lines = t.match(/.{1,26}(\s|$)/g) || [t]
    const x = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    return send(200, 'image/svg+xml', `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ban ? '#3b82f6' : '#10b981'}"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${lines.map((l, i) => `<text x="${W / 2}" y="${H / 2 - 20 + i * 36}" fill="#fff" font-family="sans-serif" font-size="30" font-weight="700" text-anchor="middle">${x(l.trim())}</text>`).join('')}<text x="${W / 2}" y="${H - 24}" fill="#fff" fill-opacity=".7" font-family="sans-serif" font-size="16" text-anchor="middle">placeholder (original image offline)${ban ? '' : ' #' + u.searchParams.get('n')}</text></svg>`)
  }
  const pg = mock.pages[u.pathname.length > 1 ? u.pathname.replace(/\/$/, '') : '/']
  if (pg) {
    const page = { component: pg[0], props: { errors: {}, partners: mock.partners, ...pg[1] }, url: u.pathname, version: null }
    return req.headers['x-inertia'] ? send(200, 'application/json', JSON.stringify(page), { 'x-inertia': 'true', vary: 'X-Inertia' }) : send(200, 'text/html; charset=utf-8', html(page))
  }
  const f = path.join(PUBLIC, path.normalize(u.pathname))
  if (f.startsWith(PUBLIC) && fs.existsSync(f) && fs.statSync(f).isFile()) return send(200, MIME[path.extname(f)] || 'application/octet-stream', fs.readFileSync(f), { 'cache-control': 'no-store' })
  send(404, 'text/plain', 'not found: ' + u.pathname)
}).listen(PORT, () => console.log('legacy harness on http://localhost:' + PORT))
