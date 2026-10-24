# Redesign plan: back to the old PICO design, improved

Branch `feat/legacy-design-shadcn`. The owner dislikes the Tenun Donggala look. This is not a new look: it continues the old PICO
dashboard (`legacy/laravel`, the Blade/Vue 2 site, and the Flutter `pico_ui_kit`) and makes it better. Nothing here is a copy of the old
code. The data layer, routing, i18n, prerender, tests, CSP, nginx container and release workflow stay.

## What the old design was

- Page: gray-200 ground, white cards with `rounded-lg` and a soft shadow, Nunito, one blue accent (blue-600), gray-800 text.
- Top bar: white, fixed, logo and "Pusat Informasi COVID-19 / Provinsi Sulawesi Tengah", text links with a blue underline, a blue
  "Download App" button. On a phone: a dark bar at the bottom (Beranda, Data, Kontak, Lainnya) and the rest in a menu.
- Case colours: Positif red, Dirawat blue, Sembuh green, Meninggal orange. Cards show Sulawesi Tengah and Indonesia side by side.
- Charts: Chart.js (daily bars, cumulative lines, Rt with a 95 % band, pie, gender and age bars), vue-select for area and case type.
- Footer: one white card with partner links, social links and the credit line.
- pico-hub (the old container on `pico.banuacoder.com`, now retired by the new site): a landing page with cards for the REST API, the API
  docs, the web dashboard, the Android app and the two source repos, a short story and the data sources. Its job moves to `/mulai`.

## Old screen to new screen: kept and improved

| Old screen | New screen | Kept | Improved |
|---|---|---|---|
| Layout.vue + Navbar.vue | `AppHeader`, `AppNav`, `MobileTabBar` | Fixed white bar, same logo and two-line title, same link order, blue underline for the active page, dark bottom bar with Beranda / Data / Kontak / Lainnya, "Download App" button | shadcn Popover for "Lainnya" on desktop, shadcn Sheet for it on a phone, `aria-current`, 44 px targets, dark mode, language and theme switches |
| Home: banners + call center cards | `HomeTop` | Banners left, Call Center 119 card right | Hotline number of the pandemic is not shown (archive); two new cards go to the API and to the app (hub role) |
| Home: "Situasi Terkini" + tabs Statistik / Vaksinasi | `SituationTabs` (shadcn Tabs), `CaseCard` | Same title, update line, tab names, four cards in the old order (Positif, Dirawat, Sembuh, Meninggal) with Sulawesi Tengah and Indonesia columns | Figures are from the last day with real counts (not the zero padding at the end of the record), each column has its own date, Rt line, text delta with an icon (not colour alone), vaccination bars as a text-first progress bar |
| Home: Apa yang harus dilakukan / diketahui | `PracticalInfo` | Same two questions, the old pictures (wash hands, mask, fever, cough, headache) | Cards, captions, links to Wiki and Isoman |
| Home: Rumah sakit rujukan, Info praktikal (infografis) | `HospitalTeaser`, `LatestInfographics` | Same order, same "see more" buttons (outlined blue) | Missing images say so, shadcn Button |
| (new) 13 kabupaten/kota | `KabupatenList` | | Sulawesi Tengah first, then its 13 kabupaten/kota; the 34 provinces are in a collapsed block at the bottom |
| Partner footer | `AppFooter` | One white card: partners, social links, credit | Links to Mulai, docs, Swagger, Metodologi |
| Data: dashboard cards | `AreaSummary`, `StatFigure` | Four case cards with the role colour | Delta with icon and sign, fatality and recovery rate, window-aware |
| Data: RDT, PCR | `TestsByType` | Two cards, PCR then RDT | Line charts with legend, table view, empty period of zeros is not shown as 0 |
| Data: map + table | `SubAreaMap` (map + table next to it) | Map of Sulawesi Tengah by kabupaten, tables | Magnitude is a mark size plus the number (no colour ramp), keyboard links, table view |
| Data: chart tabs (Kasus harian / kumulatif, v-select) | `CaseCurves` (shadcn Tabs + toggle group) | Same two tabs, area and case type choice | Daily bars + 7-day average, legend, crosshair and tooltip, table view; filters: case type, year, 30/90/180/Semua, calendar |
| Data: Rt chart | `RtChart`, `RtSection` | Rt line, 95 % band, Rt = 1 | Band is a gray area between the lower and upper bound, null Rt is a gap (never 0) and is listed, chart ends on the last Rt day, text value |
| Data: new case per kabupaten + pie | `SubAreaMap` table + curves of the selected kabupaten | The per-kabupaten view | The pie is dropped (part-to-whole of 13 slices is a table or a bar job, see dataviz choices) |
| Data: gender and age bars | `GenderAge` | Same bars | Direct labels, values as text, table view |
| Data: "Akses DATA publik / API publik" | links card in `DataPage` | Two big link cards | They go to the Tabel and to Mulai |
| Table page | `TabelView` | Tabs became a level toggle, same columns | shadcn Table, Select, Popover + RangeCalendar, pager, CSV and XLSX |
| Vaccine, Isolation, Contact, Wiki, Infographic | same pages | Same content and order | shadcn Select, ToggleGroup, Dialog, Table, Card |
| pico-hub | `/mulai` (new) | API, docs, app, source, data sources | Copy-paste example, base URL, CSV/XLSX downloads with sizes, honest app status (not on Play Store or App Store; APK on GitHub Releases) |

## shadcn-vue components (copied with the CLI into `src/components/ui`)

Button, Card, Select, Tabs, Table, Dialog, Sheet, Tooltip, Badge, Skeleton, Toggle group (and Toggle), Popover, Calendar, Range Calendar,
Input, Label, Separator. Built on reka-ui and Tailwind v4. Only the used parts reach each page's bundle (tree-shaken). The copied files are
excluded from ESLint style rules. Changes to the copies: 44 px touch size, token colours instead of white/black, a localised "Close".

## Theme

`src/styles/palette.css` holds the old palette as `--pico-*` variables (light and dark) and overrides the brand token file, which stays a
byte-exact copy of the PICO brand repo. `theme.css` maps them to Tailwind and to the shadcn names (`background`, `card`, `primary`, `muted`,
`border`, `ring`...). Tailwind's default spacing, shadow and weight scales are back (shadcn needs them). Nunito (one self-hosted Latin
variable file, 38 KB) replaces Archivo and Source Sans 3.

## Dataviz choices

| Data job | Form | Color job | Notes |
|---|---|---|---|
| Daily cases of one type, with trend | thin columns + 7-day average line | one categorical slot | the peak bar is ink, legend names both |
| Daily or cumulative, all types | multi-line, 4 series max | categorical in fixed order: Positif, Dirawat, Sembuh, Meninggal | line form (solid, dashed, dotted, double), mark shape and a direct label at the end, legend |
| Rt | line + 95 % band, Rt = 1 reference | one hue + gray band | null is a gap, never 0; windows end at the last Rt day |
| Size of 13 kabupaten | map with proportional marks + table | none (size carries magnitude) | table next to it |
| Gender and age | bars | one slot | value as text at the bar end |
| Vaccine coverage | progress bar | one slot | percentage and "x dari y" as text |
| A single figure | stat card | | role mark + word + number + change |

Palette check (`dataviz/scripts/validate_palette.js`, categorical, adjacent pairs):

- light, surface `#ffffff`: `#991b1b,#2563eb,#15803d,#c2410c`: lightness, chroma, normal-vision floor and 3:1 contrast pass; the CVD
  separation is 7.0 (WARN, the 6 to 8 band). Legal because every series also has a line form, a mark shape, a direct label and a legend.
- dark, surface `#1f2937`: `#ef4444,#3b82f6,#16a34a,#ea580c`: all checks pass; CVD worst pair 6.9 (WARN, same secondary encodings).

Windows end on the last day with real counts (a daily positive, recovered or deceased above 0): Sulawesi Tengah 9 December 2023, Indonesia
3 July 2023. Rt ends on its last non-null day (24 June 2023 and 9 July 2023). The record's last rows (to 14 January 2024) are zeros the
source padded; they are not shown as 0.

## Slices

1. Theme, fonts, shadcn catalogue, retire the Tenun patterns, illustrations and Lottie.
2. Shell: header, nav, bottom bar, footer.
3. Mulai (hub) and Beranda in the old order.
4. Data page: filters, cards, charts, Rt, map, tables.
5. Other pages onto shadcn controls.
6. Tests (vitest, Playwright + axe), docs, NOTICE, screenshots, PR.

## Not decided (for the owner)

- Palette values were moved one step for contrast (green-500 and orange-500 do not reach AA as text on white).
- The brand token file still carries the Tenun names; changing it belongs in the PICO brand repo.
- Whether the Metodologi caveat on the Tenun motif stays now that no motif is shown (kept, with a line saying so).
