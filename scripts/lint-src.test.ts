import { describe, expect, it } from 'vitest'
import { findRawColours } from './lint-src'

const hits = (s: string) => findRawColours('x.vue', s).length

describe('token lint', () => {
  it.each([
    'color: #fff;',
    'fill="#1E3A8A"',
    'background: #16203aCC',
    'color: rgb(0 0 0)',
    'color: hsla(10, 10%, 10%, 1)',
    '<div class="bg-[#123456]">',
    '<div class="text-[rgb(1,2,3)]">',
  ])('flags %s', (s) => expect(hits(s)).toBeGreaterThan(0))

  it.each([
    'color: var(--pico-ink);',
    '<div class="bg-paper text-ink p-5">',
    'fill="var(--pico-positive)"',
    'href="#konten"',
    'text-[length:var(--pico-text-md)]',
    '&#8217;',
  ])('allows %s', (s) => expect(hits(s)).toBe(0))
})
