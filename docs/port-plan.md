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
