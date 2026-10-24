import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins and drops falsy values', () => expect(cn('a', false && 'b', null, ['c', { d: true, e: false }])).toBe('a c d'))
  it('a later class wins inside its group', () => {
    expect(cn('px-5 py-2', 'px-3')).toBe('py-2 px-3')
    expect(cn('rounded-md', 'rounded-lg')).toBe('rounded-lg')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('gap-4', 'gap-2')).toBe('gap-2')
    expect(cn('flex', 'grid')).toBe('grid')
    expect(cn('min-h-touch', 'min-h-12')).toBe('min-h-12')
  })
  it('keeps classes of other groups and other variants', () => {
    expect(cn('text-sm text-ink', 'text-lg')).toBe('text-ink text-lg') // size and colour are different groups
    expect(cn('px-5', 'md:px-3')).toBe('px-5 md:px-3')
    expect(cn('hover:bg-accent', 'hover:bg-card')).toBe('hover:bg-card')
    expect(cn('border', 'border-line')).toBe('border border-line')
    expect(cn('font-semibold', 'font-display')).toBe('font-semibold font-display')
  })
  it('an unknown class is only de-duplicated', () => expect(cn('foo bar', 'foo')).toBe('bar foo'))
})
