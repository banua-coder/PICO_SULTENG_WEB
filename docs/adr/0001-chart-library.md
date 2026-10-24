# ADR 0001: charts and maps stay on hand-written d3 SVG (Unovis evaluated)

Status: accepted, 2026-10-25. Owner suggestion: use Unovis (the library under the shadcn-vue chart components).

## Problem

The charts need zoom (brush, wheel, pinch, reset, keyboard), an Rt line with a 95 % band and bound lines with gaps, a per-category colour plus a
non-colour cue, and a table view; the maps need a choropleth with legend, tooltip, click through and a table. All lazy, nothing on the home first
paint, strict CSP (`style-src 'self' 'sha256-...'`, no inline style elements), and a small client.

## Options

| Option | Measured | Notes |
|---|---|---|
| A. Unovis (`@unovis/ts` 1.7.1 + `@unovis/vue`) | esbuild, minified, tree-shaken: XYContainer + Line + Area + StackedBar + Axis + Crosshair + Tooltip + Brush = **74.7 kB gzip**; SingleContainer + TopoJSONMap = **65.8 kB gzip** (plus TopoJSON data) | Both bundles create a `<style>` element at runtime (`createElement("style")` + `insertRule`): blocked by our CSP unless `style-src 'unsafe-inline'` or a nonce, which the static nginx container cannot give. No built-in zoom plugin in the XY set (only Brush), no Rt band with null gaps and hatch, no mark shapes for the colour-independent cue. Those would be custom layers on top anyway. |
| B. Existing hand-written d3 SVG (d3-scale, d3-shape, d3-array at runtime; d3-geo at build time) | chart chunks ~tens of kB gzip in total (see the PR table) | Already has the table view, keyboard model, null gaps, role marks, live region. Zoom and bounds are added as small pure modules with unit tests. |
| C. Chart.js + chartjs-plugin-zoom (what the old site used) | ~70 kB gzip | Canvas: no accessible SVG, no per-mark focus, own tooltip DOM. Rejected as in the first redesign. |

## Decision

B for every chart and map. Unovis is not added. Reasons: 2 to 5 times the size of the code it would replace, a CSP conflict, and the three
features the owner asked for (zoom with reset and keyboard, Rt band with gaps and bounds, non-colour cues) would still be custom code.

## Consequences

- Risk: more own code to maintain. Mitigation: pure geometry in `core/` with unit tests, one shared zoom hook.
- Revisit if the CSP gains a nonce (a different host) or the chart set grows beyond what the model files cover.
