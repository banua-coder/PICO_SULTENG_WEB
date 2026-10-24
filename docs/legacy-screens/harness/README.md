# Legacy PICO Sulteng harness

Serves the compiled Laravel + Inertia + Vue 2 bundle (`public/` of branch `origin/legacy/laravel`) with mocked data in the OLD API shapes, so the old screens can be screenshotted.

Needs: node 22, internet (AnyChart 8.7.1 CDN, Google fonts/charts), Playwright (the scripts borrow `@playwright/test` from `pico-port/node_modules`).

1. Extract the legacy `public/`, `resources/`, `app/` into `/tmp/legacy-site` (`git archive origin/legacy/laravel public resources app`).
2. `sh fetch-raw.sh` pulls live data from pico-api.banuacoder.com into `./raw` (written next to the script).
3. `node build-mock.mjs [fixturesDir]` converts new-API shapes to legacy keys, writes `mock.json` (about 8 MB, not committed). Fixtures default to `pico-port/test/fixtures/api`.
4. `node server.mjs` serves http://localhost:8099 (`/`, `/data`, `/vaksin`, `/tabel-data`, `/isoman`, `/kontak`, `/wiki`, `/infografis`, `/corona/api/v1/*`).
5. `node shoot.mjs` writes all PNGs (1280x900 and 360x800, light, fullPage); `node styles.mjs` prints computed colours as hex.

Harness-only deviations: dead banner and infographic image hosts are replaced by `/ph/*` SVG placeholders; `villages/latest` returns the kabupaten rows so the Sulteng map is not wiped by MapCard's `villages` watcher; NewCase bar chart uses the last day with any new positives (the true last day is all zeros); latest PCR/RDT is the last row with sampling > 0.
