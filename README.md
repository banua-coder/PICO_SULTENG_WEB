# PICO Sulteng web

Static, prerendered Vue 3 site for the COVID-19 record of Sulawesi Tengah and Indonesia (2020-03-02 to 2024-01-14), served at `pico.banuacoder.com`. It replaces the Laravel + Inertia + Vue 2 dashboard. The old code lives on the `legacy/laravel` branch.

Specs, contracts and ADRs live in the PICO repo (`specs/web/`). Layout follows ADR-0105: features in `src/features/<page>/`, shared parts in `src/components/`, `src/api/`, `src/app/`.

## Commands

Needs Node 22 and pnpm 10 (`corepack enable`).

| Command | What |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Vite dev server |
| `pnpm build` | Snapshot and downloads from the live API, then prerender 114 pages + 404 with vite-ssg, then sitemap (`dist/`). Fails when the API stays down |
| `pnpm build:data` | Only the data step: `public/data/kabupaten-latest.json` and `public/unduh/*.csv|xlsx` (one-day disk cache in `.cache/`, `PICO_NO_CACHE=1` to skip it) |
| `pnpm check:dist` | The built site: 114 pages, unique titles, canonical, hreflang, sitemap, no broken internal link |
| `pnpm check:budget` | Size budget (spec 80). Fails when xlsx, d3 or lottie are in a page's initial JS |
| `pnpm preview` | Serve `dist/` on port 4173 (SPA fallback: use `pnpm exec tsx scripts/serve-dist.ts` to route like nginx) |
| `pnpm lint` | ESLint (feature-boundary rule), raw-colour lint, locale key parity, brand manifest check |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest unit and component tests |
| `pnpm e2e` | Playwright. Builds with `VITE_KIT=1` (adds the `/_kit` component page) and serves it with `vite preview`. First time: `pnpm exec playwright install chromium` |
| `pnpm sync:brand` | Copy brand assets from the PICO repo (`$PICO_BRAND_DIR`, default `../../PICO/brand`) and rewrite `brand.manifest.json` |
| `pnpm fixtures:record` | Record the live API into `test/fixtures/api/` (series trimmed) |
| `pnpm fixtures:check` | Drift check against the live API (nightly job) |
| `pnpm build:geo` | Project the map sources in `scripts/geo-src/` into `src/components/maps/geo/*.paths.json` (fails on an unmatched feature) |

Copy `.env.example` to `.env` to override the API base URL. Archive mode is the default (`VITE_LIVE_MODE` unset).

## Rules

- A feature never imports from another feature. Move shared code to `components/`, `api/` or `app/`.
- `<script setup lang="ts">`, typed props and emits, composables for state and side effects.

## Brand, tokens and fonts

- `src/assets/brand/` and the brand files in `public/` are copies from the PICO repo. Never edit them. Run `pnpm sync:brand`, then commit. `pnpm lint` fails if a copy differs from `brand.manifest.json`.
- `src/styles/theme.css` maps the tokens in `pico-tokens.css` into the Tailwind v4 theme. The Tailwind palette, shadows and spacing multiplier are removed, so `bg-red-500` does not exist. `p-5` means the brand's 16 px step.
- No raw colour (hex, `rgb()`, `bg-[#fff]`) in `src/` outside `assets/brand/`. Colour is `var(--pico-*)` or a theme class.
- Fonts are WOFF2 subsets in `src/assets/fonts/`, built by `python3 scripts/build-fonts.py` (needs `pip install fonttools brotli`). The outputs are committed.

## Data layer

`src/api/` is the only code that talks to pico-api. `fetchJson` unwraps the C1 envelopes (15 s timeout, one retry for network errors). `cache.ts` dedupes requests and applies the stale rule. `useResource` builds the `Resource<T>` of contract C2.

## i18n

Bahasa Indonesia has no URL prefix, English is `/en`. The route is the single source of truth for the locale. `src/locales/id.json` and `en.json` must have the same keys (`pnpm check:i18n`). Numbers and dates go through `useFormat()`.

## Component kit

Shared components are in `src/components/` (contract C3). `/_kit` and `/en/_kit` show all of them. The page exists in dev and in builds made with `VITE_KIT=1`. Production builds do not contain it. It is covered by axe in light and dark, in both locales.

## Kabupaten latest figures

`useKabupatenLatest()` reads the build-time snapshot `/data/kabupaten-latest.json` by default. Set `VITE_REGENCY_LATEST=api` to read `/regencies?include_latest_case=true` instead (pico-api PR #91, once deployed).

## Maps and charts

- Maps are SVG paths projected at build time (`pnpm build:geo`, d3-geo is a dev dependency). No map library reaches the browser. Sources and their open licence question (O-6) are in `scripts/geo-src/PROVENANCE.md`.
- Magnitude is a mark size on the `--pico-mark-1..6` ramp (by quantile) plus its number, never a colour ramp. Every map has its table next to it.
- The kabupaten band patterns are interpretations that wait for the cultural review. The map draws one only as the identity fill of the selected area, and only with `VITE_MAP_BANDS=1`. Off by default.
- Charts are hand-rolled SVG on d3-scale, d3-shape and d3-array. Every series has its line form, mark and a direct label, and every chart has a table view.

## Prerender and data

- Every page is prerendered with its own title, description, canonical, hreflang, Open Graph tags and, on data pages, JSON-LD (`usePageHead`). Series (0.4 to 0.9 MB each) are never prerendered or embedded. Small resources (partners, province and national latest rows, the kabupaten snapshot) go into each page as a `<script type="application/json" id="pico-state">` block, and the client seeds its cache from it, so hydration makes no request for them.
- `public/data/kabupaten-latest.json` is the build-time workaround for API ask A3. Set `VITE_REGENCY_LATEST=api` once `/regencies?include_latest_case=true` is deployed, then delete `scripts/snapshot-kabupaten.ts`.
- `public/unduh/{indonesia,provinsi,kabupaten-sulteng}.{csv,xlsx}` are built at deploy time. The on-click XLSX export in the table (W20) stays a lazy chunk.
- e2e: `pnpm e2e` builds with `VITE_KIT=1` and serves with `scripts/serve-dist.ts`. The smoke suite runs every route in id/en and light/dark at 1280 px (Chromium) and 360 px (Chromium and WebKit): `pnpm exec playwright install chromium webkit` once.
- The nightly job (`.github/workflows/nightly-contract.yml`) runs `pnpm fixtures:check` and `LIVE_API=1 pnpm vitest run src/api/live.test.ts`, and opens an `api-drift` issue on failure.
