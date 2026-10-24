/** Pan and zoom of a map by its viewBox only (no map library). Pure, so it is unit tested. */
export type VB = { x: number; y: number; w: number; h: number }
export const MAX_ZOOM = 8

export const fullView = (base: [number, number]): VB => ({ x: 0, y: 0, w: base[0], h: base[1] })
export const zoomLevel = (vb: VB, base: [number, number]) => base[0] / vb.w

/** Keeps the view inside the map. */
export function clampView(vb: VB, base: [number, number]): VB {
  return { ...vb, x: Math.min(Math.max(vb.x, 0), base[0] - vb.w), y: Math.min(Math.max(vb.y, 0), base[1] - vb.h) }
}

/** Zooms by `factor` (>1 in) keeping the point at fraction (fx, fy) of the view where it is. */
export function zoomAt(vb: VB, base: [number, number], factor: number, fx = 0.5, fy = 0.5): VB {
  const w = Math.min(base[0], Math.max(base[0] / MAX_ZOOM, vb.w / factor))
  const h = (w * base[1]) / base[0]
  return clampView({ x: vb.x + (vb.w - w) * fx, y: vb.y + (vb.h - h) * fy, w, h }, base)
}

/** Moves the view by (dx, dy) user units. */
export const panBy = (vb: VB, base: [number, number], dx: number, dy: number): VB => clampView({ ...vb, x: vb.x + dx, y: vb.y + dy }, base)
