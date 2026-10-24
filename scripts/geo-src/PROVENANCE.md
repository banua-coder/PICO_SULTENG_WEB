# Provenance of the map sources

| File | What | Origin |
|---|---|---|
| `sulteng.json` | 13 kabupaten/kota of Sulawesi Tengah, `MultiPolygon`, `properties.id` and `name` are names | Came with the old Laravel site (`PICO_SULTENG_WEB`, `public/assets/geojson/`). Original author and licence are unknown. |
| `indonesia.json` | 34 provinces, `MultiPolygon`, ids like `ID.ST`, upper-case names | Same. The `stroke`, `fill` and `latitude`/`longitude` properties are from the old AnyChart setup and are not used. |

Open question O-6 (owner): the origin and licence of both files. Until it is answered the files are used as they are and credited as "PICO (data peta lama)" on the Metodologi page. Nothing else in the repo depends on their licence: only the projected, simplified paths in `src/components/maps/geo/` are shipped.

`pnpm build:geo` reads these two files and writes the path files. It fails when a feature does not match the slug table of contract C5.
