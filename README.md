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
| `pnpm lint` | ESLint (includes the feature-boundary rule) |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest unit and component tests |
| `pnpm e2e` | Playwright (needs `pnpm build` first) |

Copy `.env.example` to `.env` to override the API base URL. Archive mode is the default (`VITE_LIVE_MODE` unset).

## Rules

- A feature never imports from another feature. Move shared code to `components/`, `api/` or `app/`.
- `<script setup lang="ts">`, typed props and emits, composables for state and side effects.
