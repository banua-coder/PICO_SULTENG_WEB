# PICO Sulteng web

Static, prerendered Vue 3 site for the COVID-19 record of Sulawesi Tengah and Indonesia (2020-03-02 to 2024-01-14), served at `pico.banuacoder.com`. It continues the design of the Laravel + Inertia + Vue 2 dashboard (the old code lives on the `legacy/laravel` branch) on shadcn-vue, and is also the entry point (`/mulai`) for the open API and the Android app. See `docs/redesign-plan.md` for what was kept and what was improved.

Specs, contracts and ADRs live in the PICO repo (`specs/web/`). Layout follows ADR-0105: features in `src/features/<page>/`, shared parts in `src/components/`, `src/api/`, `src/app/`.

## Commands

Needs Node 22 and pnpm 10 (`corepack enable`).

| Command | What |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Vite dev server |
| `pnpm build` | Snapshot and downloads from the live API, then prerender 116 pages + 404 with vite-ssg, then sitemap (`dist/`). Fails when the API stays down |
| `pnpm build:data` | Only the data step: `public/data/kabupaten-latest.json` and `public/unduh/*.csv|xlsx` (one-day disk cache in `.cache/`, `PICO_NO_CACHE=1` to skip it) |
| `pnpm check:dist` | The built site: 116 pages, unique titles, canonical, hreflang, sitemap, no broken internal link, and no unreviewed `data-todo` marker (see Review markers) |
| `pnpm check:budget` | Size budget (spec 80). Fails when xlsx or d3 are in a page's initial JS |
| `pnpm preview` | Serve `dist/` on port 4173 (SPA fallback: use `pnpm exec tsx scripts/serve-dist.ts` to route like nginx) |
| `pnpm lint` | ESLint (feature-boundary rule), raw-colour lint, locale key parity, brand manifest check |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest unit and component tests |
| `pnpm e2e` | Playwright. Builds with `VITE_KIT=1` (adds the `/_kit` component page) and serves it with `vite preview`. First time: `pnpm exec playwright install chromium` |
| `pnpm sync:brand` | Copy the logo, icons and token file from the PICO repo (`$PICO_BRAND_DIR`, default `../../PICO/brand`) and rewrite `brand.manifest.json`. The Tenun patterns, illustrations and Lottie files are no longer mirrored |
| `pnpm fixtures:record` | Record the live API into `test/fixtures/api/` (series trimmed) |
| `pnpm fixtures:check` | Drift check against the live API (nightly job) |
| `pnpm build:geo` | Project the map sources in `scripts/geo-src/` into `src/components/maps/geo/*.paths.json` (fails on an unmatched feature) |

Copy `.env.example` to `.env` to override the API base URL. Archive mode is the default (`VITE_LIVE_MODE` unset).

## Deploy

A tag `vX.Y.Z` builds the Docker image (nginx, prerendered `dist/`) and deploys it. The image build fails while review markers remain. See `docs/deploy.md`.

## Rules

- A feature never imports from another feature. Move shared code to `components/`, `api/` or `app/`.
- `<script setup lang="ts">`, typed props and emits, composables for state and side effects.

## Design system, tokens and fonts

- UI parts are shadcn-vue components (reka-ui + Tailwind v4) copied into `src/components/ui/` by the CLI (`components.json`; add one with `pnpm dlx shadcn-vue@latest add <name>`). They are excluded from the style lint. Local changes: 44 px touch size, token colours instead of white/black, a localised "Close". `src/lib/cn.ts` is a small stand-in for `cn` + tailwind-merge (the real one is 14 KB gzipped); the components import `cn` and an alias points it there.
- Colours are the old PICO palette in `src/styles/palette.css` (light and dark, `--pico-*` variables). It overrides the colour tokens of `src/assets/brand/pico-tokens.css`, which stays a byte-exact copy of the PICO brand repo and carries the other tokens (type sizes, marks, motion). `src/styles/theme.css` maps them to Tailwind and to the shadcn names (`background`, `card`, `primary`, `muted`, `border`, `ring`).
- No raw colour (hex, `rgb()`, `bg-[#fff]`) in `src/` outside `assets/brand/` and `styles/palette.css`. Colour is `var(--pico-*)` or a theme class. Raw Tailwind colours (`bg-red-500`) do not exist.
- The categorical colours of the charts (Positif, Dirawat, Sembuh, Meninggal) were checked with the dataviz palette validator, see `docs/redesign-plan.md`.
- Font: Nunito, one Latin variable WOFF2 in `src/assets/fonts/` (SIL OFL 1.1), as the old site.
- The logo, icons and favicon files are copies from the PICO repo. Never edit `src/assets/brand/` by hand; run `pnpm sync:brand`, then commit. `pnpm lint` fails if a copy differs from `brand.manifest.json`.

## Data layer

`src/api/` is the only code that talks to pico-api. `fetchJson` unwraps the C1 envelopes (15 s timeout, one retry for network errors). `cache.ts` dedupes requests and applies the stale rule. `useResource` builds the `Resource<T>` of contract C2.

## i18n

Bahasa Indonesia has no URL prefix, English is `/en`. The route is the single source of truth for the locale. `src/locales/id.json` and `en.json` must have the same keys (`pnpm check:i18n`). Numbers and dates go through `useFormat()`.

## Component kit

Shared components are in `src/components/` (contract C3) and the shadcn parts in `src/components/ui/`. `/_kit` and `/en/_kit` show them. The page exists in dev and in builds made with `VITE_KIT=1`. Production builds do not contain it. It is covered by axe in light and dark, in both locales.

## Kabupaten latest figures

`useKabupatenLatest()` reads the build-time snapshot `/data/kabupaten-latest.json` by default. Set `VITE_REGENCY_LATEST=api` to read `/regencies?include_latest_case=true` instead (pico-api PR #91, once deployed).

## Maps and charts

- Maps are SVG paths projected at build time (`pnpm build:geo`, d3-geo is a dev dependency). No map library reaches the browser. Sources are in `scripts/geo-src/PROVENANCE.md`. The boundary files have no recorded author or licence, see `NOTICE`.
- Magnitude is a mark size on the `--pico-mark-1..6` ramp (by quantile) plus its number, never a colour ramp. Every map has its table next to it.
- Charts are hand-rolled SVG on d3-scale, d3-shape and d3-array. Every series has its line form, mark and a direct label, a legend when there are two or more, and every chart has a table view. Windows end on the last day with real counts, Rt on its last non-null day; zero rows the source padded the record with are never shown as 0.

## Prerender and data

- Every page is prerendered with its own title, description, canonical, hreflang, Open Graph tags and, on data pages, JSON-LD (`usePageHead`). Series (0.4 to 0.9 MB each) are never prerendered or embedded. Small resources (partners, province and national latest rows, the kabupaten snapshot) go into each page as a `<script type="application/json" id="pico-state">` block, and the client seeds its cache from it, so hydration makes no request for them.
- `public/data/kabupaten-latest.json` is the build-time workaround for API ask A3. Set `VITE_REGENCY_LATEST=api` once `/regencies?include_latest_case=true` is deployed, then delete `scripts/snapshot-kabupaten.ts`.
- `public/unduh/{indonesia,provinsi,kabupaten-sulteng}.{csv,xlsx}` are built at deploy time. The on-click XLSX export in the table (W20) stays a lazy chunk.
- e2e: `pnpm e2e` builds with `VITE_KIT=1` and serves with `scripts/serve-dist.ts`. The smoke suite runs every route in id/en and light/dark at 1280 px (Chromium) and 360 px (Chromium and WebKit): `pnpm exec playwright install chromium webkit` once.
- The nightly job (`.github/workflows/nightly-contract.yml`) runs `pnpm fixtures:check` and `LIVE_API=1 pnpm vitest run` on `src/api/live.test.ts` and the two feature live tests (the Tabel CSV line count, the Methodology dates), and opens an `api-drift` issue on failure.

## Review markers

Wording that nobody has reviewed yet (for example new health copy) is marked in the page with
`<ReviewTodo id="..." note="..."/>`. It shows a dashed "TODO" box and writes `data-todo="<id>"` into the HTML.
`pnpm check:dist` fails when the built site has any marker. A branch build sets `PICO_ALLOW_TODO=1` (CI does) and lists them;
a release build must not set it, so the site cannot ship with a marker. The register of markers, who owns each and what closes it,
is in `PICO/specs/web/README.md` ("Review markers").

## Licence

The code is released under the [MIT licence](LICENSE). The licence covers the code only: the PICO logo, the pictures and the data are not automatically part of it (see the Metodologi page).
