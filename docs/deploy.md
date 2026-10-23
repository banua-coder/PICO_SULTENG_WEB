# Deploy

The site is a prerendered static build in a small nginx image, behind the shared Traefik on the VPS (ADR-0104). A tag `vX.Y.Z` runs `.github/workflows/release.yml`: build, smoke test, push to GHCR, deploy over SSH, health gate, rollback if the gate fails.

## Files

| File | What |
|---|---|
| `Dockerfile` | Stage 1: Node 22 + pnpm run `pnpm build` (needs the live API) then `check:dist` and `check:budget`. Stage 2: `nginxinc/nginx-unprivileged` (user `nginx`, port 8080) with `dist/` |
| `deploy/nginx.conf` | Routing, cache classes, gzip, security headers, CSP, `/healthz`. Same rules as `scripts/serve-dist.ts` |
| `deploy/docker-compose.yml` | Reference compose service and Traefik labels for the owner. Nothing here applies it |
| `deploy/test-container.sh` | curl checks of every routing rule, header and gzip against a running container |
| `public/theme-init.js` | The theme script. External file so the CSP needs no inline script |

## Build and run locally

```bash
docker build -t pico-web:local --build-arg PICO_ALLOW_TODO=1 .   # needs network: the build calls pico-api
docker run -d --name pico-web -p 8080:8080 pico-web:local
deploy/test-container.sh http://127.0.0.1:8080
```

Build args: `VITE_API_BASE_URL` (default `https://pico-api.banuacoder.com/api/v1`), `VITE_SITE_URL` (default `https://pico.banuacoder.com`), `VITE_LIVE_MODE` (empty = archive mode), `PICO_ALLOW_TODO`.

## Review markers stop the release

`pnpm check:dist` runs inside the image build and fails on any `data-todo` marker (unreviewed wording, register in `PICO/specs/web/README.md`). **A release build never sets `PICO_ALLOW_TODO`**, so the tag build fails while a marker remains, and nothing is pushed. `PICO_ALLOW_TODO=1` exists only for local builds and for the manual dry run (`workflow_dispatch` with `allow_todo`), which never pushes or deploys. Drop the marker by doing the review, not by setting the flag.

## What nginx does

- Route `/x/y` serves `x/y/index.html`. A path with a file extension serves that file. Anything else is `404.html` with status 404 (`404.html` is internal: asking for it directly is also a 404).
- 301: trailing slash is removed (`/data/` to `/data`), `/id/...` loses its prefix (`/id/data/` to `/data` in one hop). `/` and `/en/` keep their slash. `Location` is relative.
- Cache-Control: `/assets/*` (hashed) `public, max-age=31536000, immutable`. Pages, `404.html`, `sitemap.xml`, `/data/*.json`, `theme-init.js`: `no-cache`. Everything else (favicon, OG image, manifest, `/unduh/*`): `public, max-age=86400`. Unhashed files are never immutable. `/healthz`: `no-store`.
- `/unduh/*.csv|xlsx` get `Content-Disposition: attachment`; csv is `text/csv; charset=utf-8`; `.webmanifest` is `application/manifest+json`.
- gzip level 5, minimum 256 bytes, for html, css, js, json, xml, csv, svg, manifest. Not for png, woff2, xlsx. No brotli: the official image has no module. Measured sizes are in the W28 bead.
- Headers on every response, errors too: `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a CSP. HSTS and frame-deny come from Traefik `secure-headers@file`.
- CSP: `default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://pico-api.banuacoder.com; manifest-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. `style-src-attr` is needed for the `style=""` attributes in the prerendered HTML. The inline JSON state block is `type=application/json`, which is not executed. Changing the API host or adding a third-party origin means editing `connect-src` or `img-src` in `deploy/nginx.conf`.
- Methods other than GET and HEAD get 405.

## Secrets (GitHub repository settings, Actions)

Create these in the repo (or in the `production` environment). The values come from the owner. This repo holds none.

| Secret | Meaning |
|---|---|
| `DEPLOY_SSH_KEY` | Private key of a deploy user on the VPS |
| `DEPLOY_HOST` | VPS host name or IP |
| `DEPLOY_PORT` | SSH port |
| `DEPLOY_USER` | SSH user that may run `docker compose` |
| `DEPLOY_PATH` | Compose directory on the VPS, e.g. `/opt/docker/apps/pico-web` |
| `HEALTH_CHECK_URL` | `https://pico.banuacoder.com/healthz`. The gate also checks `/data` on the same origin |

`GITHUB_TOKEN` pushes the image. No other secret is used. The `deploy` job uses the GitHub environment `production`: add required reviewers there if you want an approval before each deploy. Workflow permissions need `packages: write`; the package `ghcr.io/banua-coder/pico-web` must allow this repo to publish (Package settings, "Manage Actions access"), and must be public or have a pull credential on the VPS.

## First-time VPS steps (owner)

1. `mkdir -p /opt/docker/apps/pico-web`, copy `deploy/docker-compose.yml` there, and put the deploy user's public key in `authorized_keys`.
2. Make sure the Docker host can pull `ghcr.io/banua-coder/pico-web` (public package, or `docker login ghcr.io` with a read token).
3. The workflow writes `.env` (`PICO_WEB_VERSION=x.y.z`) and keeps the previous line in `.env.previous`.
4. Watchtower stays off for this container (`com.centurylinklabs.watchtower.enable=false`): CI deploys it and can see if it fails.

## Cutover from the placeholder (open item O-1, owner needed)

`pico.banuacoder.com` already points at the VPS (DNS needs no change). Today Traefik serves the placeholder page from the **file provider**: router `pico-hub` (`Host(pico.banuacoder.com)`, middlewares `secure-headers`, `sablier-pico-hub`, service `pico-hub-svc` to `http://pico-hub:80`) in `/opt/docker/traefik/config/dynamic.yml`, with container `pico-hub` in `/opt/docker/apps/pico-api/docker-compose.yml`. To launch:

1. Owner says yes to replacing the placeholder (its usage claim is unsourced, ADR-0104 R1).
2. Deploy the first tag. The `pico-web` router has `priority=100`, so it wins over `pico-hub` (same rule, same default priority) without an edit to the Traefik file.
3. Check by `curl` (below). Then remove the `pico-hub` router and `pico-hub-svc` from `dynamic.yml` and the `pico-hub` service from the pico-api compose, and drop the `priority` label.
4. Rollback of the cutover: stop `pico-web` (`docker compose stop`), and the placeholder answers again.

## Release

```bash
git tag v1.0.0 && git push origin v1.0.0
```

The tag pushes `1.0.0`, `1.0` and `latest`. Dry run: Actions, Release, "Run workflow" (tick `allow_todo` while markers remain). It builds and smoke tests the image, nothing more.

Checks after a deploy (the workflow already does the first two):

```bash
curl -fsS https://pico.banuacoder.com/healthz
curl -sI -H 'Accept-Encoding: gzip' https://pico.banuacoder.com/data      # 200, content-encoding: gzip, content-security-policy
curl -s -o /dev/null -w '%{http_code}\n' https://pico.banuacoder.com/nope # 404
curl -sI https://pico.banuacoder.com/data/                                 # 301 Location: /data
```

## Rollback

- Automatic: when the health gate fails, the workflow restores `.env.previous` and runs `docker compose up -d`.
- Manual: on the VPS, `cd $DEPLOY_PATH && echo PICO_WEB_VERSION=<previous x.y.z> > .env && docker compose pull && docker compose up -d`. Tags in GHCR are never deleted.
- Data is part of the image (snapshot at build time), so an old tag shows old data. This is an archive, so that is fine.

## Old URLs

`banuacoders.com/corona` expired and cannot redirect. Old paths on this host fall to the 404 page. The table is in contract C5.

## Not done here (W30)

Secrets, repo and package permissions, removing review markers, cultural review `pico-jlc.8`, the placeholder replacement (O-1), Lighthouse and screen reader pass, sitemap submission. See the W30 bead.
