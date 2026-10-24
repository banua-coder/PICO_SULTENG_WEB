# Port plan: the owner's legacy components, ported not reinterpreted

Branch `fix/port-legacy-components`. PR #7 (v6.1.0) reinterpreted the old design. This branch ports the owner's own components and improves only
around them. Sources of truth:

- `legacy/laravel` branch (`resources/js/...`), copied in `~/Documents/Projects/PICO/legacy-assets/web/vue-src/` (newer: has the 12-17 group)
- the owner's old Hostinger host, `~/Documents/Projects/PICO/legacy-assets/hostinger-corona/` (`lara_cov/resources/js`, `corona-public`,
  `storage/{banners,donations,images/partner,geojson}`; the older build, no 12-17 group)
- legacy charts: Chart.js 3 + chartjs-plugin-zoom (daily, cumulative, Rt). Legacy maps: AnyChart 8 (choropleth by quantile classes and
  bubble). AnyChart and its code are not reused: licence and size. The look and behaviour are rebuilt on d3 SVG (maps are projected at
  build time by d3-geo).
- the Flutter app (`pico_ui_kit`, `features/statistic`) for the look the owner built in the app.

The old site rendered locally for comparison: `docs/legacy-screens/` (harness in `docs/legacy-screens/harness/`).

## Component map

| Legacy component | New file | Status |
|---|---|---|
| `components/CardCase.vue` (4 case cards, Sulteng + Indonesia halves, colour chip with double chevron) | `src/components/CaseCard.vue`, `CaseCardGroup.vue` | ported |
| `components/Statistics.vue` (grid 1/2/4 columns) | `CaseCardGroup.vue` | ported |
| `components/CardSuspect.vue` (ODP/PDP cards) | `features/data/components/OdpPdpNote.vue` (text note) | not ported: the figures stop on 8 May 2022 |
| `components/CardVaccineHome.vue` (dose card, 5-segment bar, 5 group lines) | `src/components/vaccine/VaccineCard.vue` | ported |
| `components/CardVaccineTarget.vue` (target tiles) | `src/components/vaccine/VaccineTargetCard.vue`, `features/vaksin/components/VaccineCards.vue` | ported |
| `components/DataTabs.vue`, `_pages/home/VaccineData.vue` (underline tabs, Nasional / Sulawesi Tengah) | `src/components/LegacyTabs.vue`, `features/beranda/components/SituationTabs.vue` | ported (Sulawesi Tengah first) |
| `_pages/data/map/Map.vue`, `MapCard.vue` (choropleth by quantile, bubble, tooltip, legend, zoom) | `src/components/maps/*`, `features/data/components/SubAreaMap.vue` | ported on d3 paths (see PR) |
| `public/assets/geojson/{sulteng,indonesia}.json` | `scripts/geo-src/*` -> `src/components/maps/geo/*.paths.json` (build-geo) | reused |
| `_pages/data/chart/RtChart.vue` (Rt line, 95 % band, zoom, Reset Zoom) | `src/components/charts/RtChart.vue` | ported with upper/lower bound lines |
| `_pages/data/chart/DailyChart.vue`, `CumulativeChart.vue` (+ DailyTab, CumulativeTab, ChartTab) | `src/components/charts/TimeSeriesChart.vue`, `features/data/components/CaseCurves.vue` | ported with brush, wheel, pinch, keyboard zoom |
| DailyTab level choice (Sulawesi Tengah / Indonesia, kabupaten) | `features/data/components/LevelSwitch.vue` | extended: Nasional, Provinsi (34), Kabupaten/Kota (13) |
| `Pages/Table` provinsi and kabupaten tabs | `features/tabel/*` | kept (already had levels) |
| `Shared/PartnerFooter.vue` (partner logos) | `components/layout/AppFooter.vue`, `public/partners/*` | ported with the real logos |
| `ShareableItems` / Infographic images | `features/beranda/components/LatestInfographics.vue`, `features/infografis/*` | tiles with dead images are hidden |

Colours: exact hex of the old CSS (Tailwind 2): Positif `#991b1b`, Dirawat `#2563eb`, Sembuh `#10b981`, Meninggal `#f97316`;
vaccine groups blue-500, purple-500, orange-500, pink-600, pink-400, total green. See `src/styles/palette.css`, `palette-vaccine.css`.

## Acceptance status

See the PR description for the item-by-item table. Decisions: `docs/adr/0001-chart-library.md` (Unovis evaluated, not adopted), `docs/legacy-vs-new.md`
(screens side by side), `NOTICE` (provenance of every copied file).

## Data page: PCR/RDT, new cases, case share (fork DATA)

| Legacy | New | Status |
|---|---|---|
| `_pages/data/DataPCR.vue`, `DataRDT.vue` (coloured blocks, white text) | `features/data/components/TestBlock.vue` above each chart card in `TestsByType.vue`, PCR first | ported. Total = positive + negative + invalid + in process over all periods (legacy `jumlah_sampling`), each result with its share, last update date. White on the exact hex fails (`#18ad5b` 2.93, `#217bc4` 4.47 to 1): the panel is the next darker step (`#11793f`, `#1a6fb0`, white 5.5 and 5.3 to 1) and the exact legacy hex is the 8 px left rule (`--pico-test-*` in `palette-vaccine.css`). |
| `chart/NewCase.vue` ("Perubahan Data di Kabupaten/Kota") | `features/data/components/NewCases.vue` (BarList, table view), `src/app/newCases.ts`, build file `public/data/kabupaten-newcases.json` | ported as one metric at a time (Positif / Sembuh / Meninggal toggle) instead of three grouped bars, sorted largest first, on the last day any kabupaten reported a new positive (20 June 2023 in the API; the zero rows after it are padding). Shown on the Sulawesi Tengah and kabupaten pages; loads after hydration (client only). |
| `chart/PieChart.vue` (pie of Dirawat, Sembuh, Meninggal) | same file, "Komposisi kasus": three labelled bars | **not a pie**: three shares that are compared read better as bars, and each label carries count and percent as text. Kabupaten pages have no Dirawat (stated, not 0). Shown on every area. |

## Map date rule (reviewer item 3)

Problem: the map caption said "14 Januari 2024", the zero-padded end of the record, while the cards show each area's last real day.

Checked on the live API (all 34 provinces, the 13 kabupaten/kota, Indonesia, series via `scripts/lib/series.ts`):
- Every series ends on 2024-01-14, and the last row of almost every area is all zeros. The cumulative totals on the last row and on the area's last real day are
  identical for all 48 areas, so the map numbers were right; only the date was wrong.
- Real counts on 14 Jan 2024 exist for three areas: recovered +22 in Banggai, +38 in Sumatera Barat, +490 in Gorontalo (active goes down by the same amount). For
  them the rule keeps that day.
- The other areas' last real days run from 2023-01-25 (Banggai Kepulauan) to 2023-12-16 (Kota Palu, Tolitoli) for kabupaten and 2023-06-30 (Sulawesi Selatan) to 2023-12-09 for provinces.

Rule (one, same as the cards, `src/app/homeLatest.ts` `lastRealRow`): an area's number is its cumulative total on its own last day with a positive, recovered or deceased count above 0.
- `scripts/snapshot-lastreal.ts` (in `build:data`) writes `public/data/last-real.json` (`{provinsi: {code: date}, kabupaten: {code: date}}`, about 2 KB); it is seeded into the prerender like the other build files.
- Items carry `date` (their own day); the table has a "Per tanggal" column, the tooltip says "Per <date>", the legend title and the caption give the range from the oldest to the newest last real day (one date when they agree).
- Fallback: an area missing from the file keeps its row date.

## Map ramps (reviewer item 5)

The legacy `Map.vue` ramps (12 colours each, 9-quantile classes) were run through the dataviz validator, `validate_palette.js --ordinal --mode light --surface #ffffff` on the 11 class colours:

| Category | Lightness monotone | Hue spread | Light end vs white | Adjacent delta-L | Decision |
|---|---|---|---|---|---|
| Positif (#e38e5d to #900000) | pass | 27 deg (pass) | 2.53:1 (pass) | fail (0.03 per step) | **adopted** (9 of its 11 colours) |
| Dirawat (#418a47 green, yellow, orange, to #900000 red) | fail (out of order) | 118 deg (fail) | 1.51:1 (fail) | fail | kept single-hue blue to the exact #2563eb: the legacy ramp ends in red, the Positif colour |
| Sembuh (#deedcf green to #0a2f51 navy) | pass | 121 deg (fail) | 1.23:1 (fail) | fail | kept single-hue green to #10b981: navy reads as Dirawat blue |
| Meninggal (#fff3ba to #da7f25) | pass | 38 deg (pass) | 1.12:1 (fail) | fail | kept single-hue orange to #f97316: the lightest steps vanish on white |

Rule used: a legacy ramp is adopted when lightness is monotone, it stays one hue family (spread <= 40 deg), its light end clears the surface (>= 2:1) and the label colour (black or white) reaches 4.5:1 on every step; adjacent delta-L fails for every 9-step ramp (the legacy ones and ours), which is why every area also has an outline, a printed number, legend counts and a table. Positif labels: black on steps 1-4, white on 5-9 (4.98 to 9.61:1). The Sulawesi Tengah kabupaten map uses the same ramps.

## Rt axis (reviewer item 4)

The legacy axis ran to 12 and showed the whole 7.5 peak. The default is now the full scale (nice maximum of the estimate and the upper bound in view); "Skala dipotong" (toggle, aria-pressed) cuts the axis at 4, rings the values above it and lists them. One hint paragraph under the chart holds the key, the scale note and the zoom hints.

## Vaksin and Isoman (round 3)

| Legacy | New | Status |
|---|---|---|
| `_pages/vaccine/VaccineProgress.vue` (Progress Vaksinasi: Dosis 1 / Dosis 2, six cards each) | `features/vaksin/components/VaccineProgress.vue`, `components/vaccine/VaccineProgressCard.vue` | ported; per-group daily change from the API (`daily`, `previousDaily` on groups) |
| `Pages/Vaccine/Index.vue` (no coverage chart besides the cards) | `VaksinBody.vue` | CoverageNow and CoverageByGroup removed; DosesOverTime kept as an improvement |
| `Pages/Isolation/Index.vue`, `_pages/isolation/*` | `features/isoman/*` (IsomanView, IsomanCtas, IsomanCategories, IsomanGuide.{id,en}) | ported in legacy order; Pendataan card says the service is no longer active; no "Peralatan isoman" card exists in the legacy source (the fourth card is FAQ) |
| donation pictures (`storage/donations`) | `public/media/donations` | 7 of 8 removed (private data), see NOTICE |
