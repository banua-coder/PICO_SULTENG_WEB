#!/usr/bin/env bash
# Routing, header and gzip checks against a running container: deploy/test-container.sh [http://127.0.0.1:8080]
# Mirrors scripts/serve-dist.ts (C5). Exit 1 on the first failed group.
BASE=${1:-http://127.0.0.1:8080}
fail=0
ok()  { echo "ok   $*"; }
bad() { echo "FAIL $*"; fail=1; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
hdr()  { curl -sI "${@:2}" "$BASE$1"; }   # hdr <path> [curl args]
status() { # status <path> <want> [want-location]
  local got loc; got=$(code "$BASE$1"); loc=$(hdr "$1" | tr -d '\r' | awk -F': ' 'tolower($1)=="location"{print $2}')
  if [ "$got" = "$2" ] && { [ -z "${3:-}" ] || [ "$loc" = "$3" ]; }; then ok "$1 -> $got ${loc}"; else bad "$1 -> $got ${loc} (want $2 ${3:-})"; fi
}
has() { # has <path> <header-regex> [curl args]
  if hdr "$1" "${@:3}" | tr -d '\r' | grep -Eqi "^$2"; then ok "$1 has $2"; else bad "$1 lacks $2"; fi
}
lacks() { if hdr "$1" "${@:3}" | tr -d '\r' | grep -Eqi "^$2"; then bad "$1 has $2"; else ok "$1 has no $2"; fi; }

echo "== pages: nested index.html, 200"
for p in / /en/ /en /data /en/data /data/provinsi/aceh /en/data/provinsi/aceh /data/kabupaten/banggai /tabel-data /vaksin /isoman /infografis /metodologi /kontak; do status "$p" 200; done
echo "== unknown path: real 404 with 404.html"
for p in /nope /data/nope /assets /assets/nope.js /404 /404.html /nope.png /en/nope /unduh /data/kabupaten; do status "$p" 404; done
curl -s "$BASE/nope" | grep -q '<title>' && ok "/nope body is the 404 page" || bad "/nope has no 404 page body"
echo "== trailing slash 301, /id/ prefix 301, /en/ kept"
status /data/ 301 /data
status /data/provinsi/aceh/ 301 /data/provinsi/aceh
status /en/data/ 301 /en/data
status '/data/?a=1' 301 '/data?a=1'
status /id 301 /
status /id/ 301 /
status /id/data 301 /data
status /id/data/ 301 /data
status /id/en/ 301 /en/
status /id/data/provinsi/aceh 301 /data/provinsi/aceh
status /idx 404
status /en/ 200
echo "== healthz"
status /healthz 200
has /healthz 'cache-control: no-store'
echo "== methods"
[ "$(code -X POST "$BASE/data")" = 405 ] && ok "POST /data -> 405" || bad "POST /data not 405"
echo "== cache classes"
A=$(curl -s "$BASE/" | grep -o '/assets/[^"]*\.js' | head -1)
has "$A" 'cache-control: public, max-age=31536000, immutable'
has /data 'cache-control: no-cache'
has / 'cache-control: no-cache'
status /404.html 404
has /nope 'cache-control: no-cache'
has /sitemap.xml 'cache-control: no-cache'
has /data/kabupaten-latest.json 'cache-control: no-cache'
has /favicon.svg 'cache-control: public, max-age=86400'
has /og-image-1200x630.png 'cache-control: public, max-age=86400'
has /unduh/indonesia.csv 'cache-control: public, max-age=86400'
lacks /favicon.svg 'cache-control: .*immutable'
echo "== types and downloads"
has /site.webmanifest 'content-type: application/manifest\+json'
has /sitemap.xml 'content-type: (application|text)/xml'
has /unduh/indonesia.csv 'content-type: text/csv; charset=utf-8'
has /unduh/indonesia.csv 'content-disposition: attachment'
has /unduh/indonesia.xlsx 'content-type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
has /unduh/indonesia.xlsx 'content-disposition: attachment'
has /favicon.svg 'content-type: image/svg\+xml'
lacks /data 'content-disposition'
has /data 'content-type: text/html; charset=utf-8'
echo "== security headers (on 200, 301 and 404)"
for p in /data /data/ /nope; do
  has "$p" 'x-content-type-options: nosniff'
  has "$p" 'referrer-policy: strict-origin-when-cross-origin'
  has "$p" 'permissions-policy: '
  has "$p" "content-security-policy: default-src 'self'; script-src 'self'.*connect-src 'self' https://pico-api.banuacoder.com.*object-src 'none'.*frame-ancestors 'none'"
done
lacks /data 'server: nginx/'
echo "== gzip"
for p in /data /assets/$(basename "$A") /sitemap.xml /site.webmanifest /favicon.svg /data/kabupaten-latest.json /unduh/indonesia.csv; do
  has "$p" 'content-encoding: gzip' -H 'Accept-Encoding: gzip'; has "$p" 'vary: accept-encoding' -H 'Accept-Encoding: gzip'
done
for p in /unduh/indonesia.xlsx /og-image-1200x630.png; do lacks "$p" 'content-encoding' -H 'Accept-Encoding: gzip'; done
lacks /data 'content-encoding'
echo "== sizes (plain -> gzip)"
for p in /data /assets/$(basename "$A") /sitemap.xml /favicon.svg /data/kabupaten-latest.json /unduh/indonesia.csv; do
  a=$(curl -s "$BASE$p" | wc -c); b=$(curl -s -H 'Accept-Encoding: gzip' "$BASE$p" | wc -c); echo "$p $a -> $b"
done
[ $fail = 0 ] && echo "ALL OK" || { echo "SOME FAILED"; exit 1; }
