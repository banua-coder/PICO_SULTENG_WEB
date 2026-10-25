# Legacy vs new

Left: the owner's old site, rendered from its compiled bundle with live data (`docs/legacy-screens/`, harness in `docs/legacy-screens/harness/`).
Right: this branch (`docs/new-screens/`, light; dark and 360 px versions sit next to each file as `-dark` and `-360`).
The old site had no dark mode. Dates differ a little: the old mock ended on 14 January 2024 (zero padding), the new site stops on the last day with real counts.


### 1. Home (1280 and 360)

Restored: Hotline card, social card (Instagram, X), blue risk CTA with "Periksa sekarang" (to the isoman guide), "Lindungi diri" card with the checklist and the v2 illustrations, Info praktikal rows with Lihat and Bagikan, ODP/PDP cards, the Mitra logo grid. Kept from the redesign: 13 kabupaten/kota list, Rt card, +/- chips, archive line.

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/home-1280.jpg) | ![](new-screens/home-1280-light.jpg) |
| ![](legacy-screens/home-360.jpg) | ![](new-screens/home-360-light.jpg) |
| ![](legacy-screens/home-vaksinasi-1280.jpg) | ![](new-screens/home-vaksinasi-1280-light.jpg) |

### 2. Case cards, ODP/PDP cards

ODP/PDP: last real figures with their date (8 May 2022) and a note that the source stopped; shares only when the total is above 0; no NaN, no fake 0. Legacy showed (NaN%) and 0. Dark: same names with `-dark`.

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/crops/cards-home-1280.jpg) | ![](new-screens/data-cards-1280-light.jpg) |
| ![](legacy-screens/crops/cards-home-360.jpg) | ![](new-screens/data-cards-360-light.jpg) |
| ![](legacy-screens/home-1280.jpg) | ![](new-screens/data-odp-pdp-1280-light.jpg) |

### 3. Vaccine cards

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/crops/vaccine-home-1280.jpg) | ![](new-screens/home-vaksinasi-1280-light.jpg) |
| ![](legacy-screens/vaksin-1280.jpg) | ![](new-screens/vaksin-cards-1280-light.jpg) |
| ![](legacy-screens/vaksin-360.jpg) | ![](new-screens/vaksin-cards-360-light.jpg) |

### 4. Data: PCR/RDT blocks and new cases per kabupaten

Blocks keep the legacy order (PCR green, RDT blue); the exact legacy hex is the left rule, the panel uses the darker step so white text passes (2.93 and 4.47 to 1 on the exact hex).

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/data-1280.jpg) | ![](new-screens/data-pcr-rdt-1280-light.jpg) |
| ![](legacy-screens/data-360.jpg) | ![](new-screens/data-pcr-rdt-360-light.jpg) |
| ![](legacy-screens/data-1280.jpg) | ![](new-screens/data-new-cases-1280-light.jpg) |

### 5. Choropleth maps (9 quantile classes, exact legacy end hex)

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/data-map-sulteng-1280.jpg) | ![](new-screens/data-map-sebaran-1280-light.jpg) |
| ![](legacy-screens/data-map-indonesia-1280.jpg) | ![](new-screens/data-map-sebaran-360-light.jpg) |
| ![](legacy-screens/data-map-titik-1280.jpg) | ![](new-screens/data-map-titik-1280-light.jpg) |

### 6. Zoomable charts and Rt with bounds

Wheel zoom needs a click or focus on the chart first (hint shown); Ctrl/Cmd+wheel always works.

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/data-chart-harian-1280.jpg) | ![](new-screens/data-chart-harian-1280-light.jpg) |
| ![](legacy-screens/data-chart-kumulatif-1280.jpg) | ![](new-screens/data-chart-kumulatif-1280-light.jpg) |
| ![](legacy-screens/data-rt-1280.jpg) | ![](new-screens/data-rt-1280-light.jpg) |
| ![](legacy-screens/data-rt-zoomed-1280.jpg) | ![](new-screens/data-rt-zoomed-1280-light.jpg) |

### 7. Levels: Nasional, Provinsi, Kabupaten/Kota

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/data-1280.jpg) | ![](new-screens/data-level-nasional-1280-light.jpg) |
| ![](legacy-screens/data-1280.jpg) | ![](new-screens/data-level-provinsi-1280-light.jpg) |
| ![](legacy-screens/data-1280.jpg) | ![](new-screens/data-level-kabupaten-1280-light.jpg) |

### 8. Other pages

The brand v2 illustrations replace the old raster pictures on Wiki, Kontak, Isoman and in the empty, error, offline and no-data states; Lottie plays only for loading, the copy-success moment and the handwash tip, after the poster, never under reduced motion.

| Legacy (owner's site) | New |
|---|---|
| ![](legacy-screens/isoman-1280.jpg) | ![](new-screens/isoman-1280-light.jpg) |
| ![](legacy-screens/kontak-1280.jpg) | ![](new-screens/kontak-1280-light.jpg) |
| ![](legacy-screens/wiki-1280.jpg) | ![](new-screens/wiki-1280-light.jpg) |
| ![](legacy-screens/infografis-1280.jpg) | ![](new-screens/infografis-1280-light.jpg) |
| ![](legacy-screens/isoman-360.jpg) | ![](new-screens/isoman-360-light.jpg) |
| ![](legacy-screens/kontak-360.jpg) | ![](new-screens/kontak-360-light.jpg) |
| ![](legacy-screens/wiki-360.jpg) | ![](new-screens/wiki-360-light.jpg) |
| ![](legacy-screens/infografis-360.jpg) | ![](new-screens/infografis-360-light.jpg) |

## Remaining differences (honest list)

- Vaksin: the page now has the legacy "Progress Vaksinasi" block (Dosis 1 and Dosis 2 columns, six cards each: Semua, Lansia, Petugas Publik, Tenaga Kesehatan, Masyarakat Umum dan Rentan, 12-17, group colour, figure, bar, "x % dari y"). The first redesign had dropped it for plain bars; the plain bars and the "capaian menurut kelompok" chart are gone because the legacy had neither. The legacy underline tabs Nasional / Sulawesi Tengah are the scope toggle; the bar fill of "Semua" is the exact green `#10b981` (legacy bg-green-700 bar), text is green-700. Over-100 % groups print the real percent and the bar stops at 100 %.
- Isoman: the page follows the legacy order again (four cards, the care boxes, Isolasi di Rumah, Kontak Erat, Kapan Bebas Isoman, Tes PCR Ulang, Donasi, Konsultasi dengan Dokter) with the legacy guide text. The four cards are the legacy four (Konsultasi dokter, Pendataan isoman, **Pertanyaan seputar isoman (FAQ)**, Donasi): there was no "Peralatan isoman" card in the legacy source. "Pendataan isoman" is kept with "Layanan ini tidak aktif lagi" (its backend is gone), the FAQ card keeps its link with a 2021 note. The risk categories are the legacy four-box grid (Tanpa gejala, Ringan, Sedang, Berat-Kritis), not a table. The "Tanda bahaya" alert is an addition on top. Pandemic guidance, copied as it was, with a note that it may have changed.
- Donation posters: 7 of the 8 pictures from the old storage were removed because they show private phone numbers, accounts or a face (list in NOTICE). The cards without a picture are title cards. The bank account numbers the API gives for each donation are still shown as text (owner's earlier decision).
- Map dates: each area's value is its cumulative total on its own last real day (a day with positive, recovered or deceased above 0); the caption gives the range of those dates, the table has a "Per tanggal" column. On the live API only Banggai (+22 recovered), Sumatera Barat (+38) and Gorontalo (+490) have real counts on 14 January 2024. The cumulative totals of the last row and of the last real day are identical for all 48 areas, so only the date changed. Rule and numbers: `docs/port-plan.md`.
- Map ramps: Positif uses the legacy ramp (9 of its 11 colours, ends `#900000`); Dirawat, Sembuh and Meninggal keep single-hue ramps that end on the exact role hex, because the legacy ramps fail the validator (Dirawat not monotone and it ends in the Positif red; Sembuh and Meninggal start under 1.3:1 against white). Numbers in `docs/port-plan.md` ("Map ramps").
- Rt chart: the default axis is the full range (as the legacy 0 to 12 axis); "Skala dipotong" cuts at 4 for readability and marks the clipped points.

- Maps: single-hue sequential ramps (the legacy ramps were multi-hue, Dirawat ran green to red), up to 9 classes by quantile mid-rank (fewer when fewer distinct values), no "less than min / greater than max" extra bins; adjacent-step lightness gap is small (ordinal validator: monotone and single hue pass, adjacent delta-L and light-end contrast fail), so each area also has an outline, a printed number, legend ranges with counts and a table. Tooltip is custom HTML, not AnyChart's. No export button. No Balaesang view: the API serves no village or district data (`/villages`, `/villages/latest?district=7205130`, `/districts` return 404; the Go repo has no such routes).
- Charts: wheel zoom after a click or focus (or Ctrl/Cmd+wheel) so the page keeps scrolling; no overview strip (pan slider and buttons instead); Dirawat has no daily bars (it is a count of patients).
- Pie of Dirawat, Sembuh, Meninggal is three labelled bars with count and percent, because a part-to-whole of three compared shares reads better as bars (dataviz rule); same numbers.
- New cases per kabupaten: one metric at a time (toggle) instead of three grouped bars; the last day with a new positive (20 June 2023).
- Home: the Hotline number is text (it is a pandemic number that may not answer), the social card is hidden on phones, "Periksa sekarang" goes to the isoman guide (the legacy chatbot link is dead), the Info praktikal rows open the Infografis page (no inline viewer), the Mitra grid shows the API's footer partners only (no Chart.js, Laravel, AnyChart logos).
- ODP/PDP: no daily change lines (the data has no daily ODP/PDP changes).
- Infographic pictures are on dead hosts: rows and tiles work without pictures.
- Level switch: the area is in the URL path (canonical, prerendered pages); `?tingkat=&wilayah=` redirects there. Kabupaten level exists only for Sulawesi Tengah (the API serves no others). The home page keeps the fixed Sulawesi Tengah + Indonesia pair.
- Colours: text on white uses the next darker step for green and orange (and the PCR/RDT panels); fills use the exact hex.
- The legacy screenshots are rendered from the compiled bundle with mock data built from the live API; where the legacy bundle had bugs (map not coloured until a selector changes) the harness toggles it.

## Colours (acceptance 4)

| Category | Legacy class | Hex | Used in |
|---|---|---|---|
| Positif | red-800 | `#991b1b` | card name, chip, chart, map ramp, legend |
| Dirawat | blue-600 | `#2563eb` | same |
| Sembuh | green-500 | `#10b981` | chip, chart, map ramp start; text uses `#047857` (legacy green-700, used by the old vaccine figures) |
| Meninggal | orange-500 | `#f97316` | chip, chart, map ramp start; text uses `#c2410c` |

Text in green and orange on white would not reach WCAG AA with the exact hex (2.54 and 2.80 to 1); the card text uses the next darker step of the same hue,
fills and marks use the exact hex. Dark mode uses the exact legacy green and orange too (the 600 steps it used before made Positif and Meninggal almost the same colour, see docs/contrast-audit.md).

`node validate_palette.js "#991b1b,#2563eb,#10b981,#f97316" --mode light --surface "#ffffff"`: all checks pass; warning: contrast of `#10b981` (2.54) and
`#f97316` (2.80) against white is under 3:1 ("relief required"): the relief is the word, the chip chevron, the printed number and the table view.
CVD worst pair deutan 11.5 (pass). Dark (`#ef4444,#3b82f6,#10b981,#f97316` on `#1f2937`): worst pair over all pairs 6.8 (Positif / Meninggal, tritan); docs/contrast-audit.md has the full table.
Colour is never the only cue: category word on every card, role mark shapes (square, triangle, diamond, bars) on charts and legends, numbers printed on map areas, line forms.
