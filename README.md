# PICO Sulteng web

Static, prerendered Vue 3 site for the COVID-19 record of Sulawesi Tengah and Indonesia (2020-03-02 to 2024-01-14), served at `pico.banuacoder.com`. It replaces the Laravel + Inertia + Vue 2 dashboard. The old code lives on the `legacy/laravel` branch.

Specs, contracts and ADRs live in the PICO repo (`specs/web/`). Layout follows ADR-0105: features in `src/features/<page>/`, shared parts in `src/components/`, `src/api/`, `src/app/`.

## Commands

Needs Node 22 and pnpm 10 (`corepack enable`).

| Command | What |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Vite dev server |
| `pnpm build` | Prerender with vite-ssg into `dist/` |
| `pnpm preview` | Serve `dist/` on port 4173 |
| `pnpm lint` | ESLint (feature-boundary rule), raw-colour lint, locale key parity, brand manifest check |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest unit and component tests |
| `pnpm e2e` | Playwright. Builds with `VITE_KIT=1` (adds the `/_kit` component page) and serves it with `vite preview`. First time: `pnpm exec playwright install chromium` |
| `pnpm sync:brand` | Copy brand assets from the PICO repo (`$PICO_BRAND_DIR`, default `../../PICO/brand`) and rewrite `brand.manifest.json` |
| `pnpm fixtures:record` | Record the live API into `test/fixtures/api/` (series trimmed) |
| `pnpm fixtures:check` | Drift check against the live API (nightly job) |

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
