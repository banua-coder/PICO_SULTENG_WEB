import { describe, expect, it } from 'vitest'
import { recolorDark } from './recolor'

const fl = (nm: string, k: number[]) => ({ ty: 'fl', nm, c: { a: 0, k } })
describe('recolorDark', () => {
  it('swaps a named slot for its dark value, leaves skin and unknown shapes alone, does not mutate', () => {
    const src = { layers: [{ shapes: [fl('pico-blob', [0.86, 0.92, 1]), fl('pico-skin', [0.9, 0.7, 0.6]), fl('other', [1, 0, 0])] }] }
    const out = recolorDark(src)
    expect(out.layers[0]!.shapes[0]!.c.k).toEqual([0.12, 0.23, 0.54])
    expect(out.layers[0]!.shapes[1]!.c.k).toEqual([0.9, 0.7, 0.6])
    expect(out.layers[0]!.shapes[2]!.c.k).toEqual([1, 0, 0])
    expect(src.layers[0]!.shapes[0]!.c.k).toEqual([0.86, 0.92, 1])
  })
  it('leaves animated colours (a: 1) alone', () => {
    const out = recolorDark({ ty: 'st', nm: 'pico-blue', c: { a: 1, k: [{ t: 0 }] } })
    expect(out.c.k).toEqual([{ t: 0 }])
  })
})
