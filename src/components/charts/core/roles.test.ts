import { describe, expect, it } from 'vitest'
import { LINE_ROLES, lineForm, MARK, weaveFill } from './roles'

describe('data roles are never told apart by colour alone (DESIGN.md)', () => {
  it('the four line roles have four different line forms', () => {
    const forms = LINE_ROLES.map((r) => JSON.stringify(lineForm(r)))
    expect(new Set(forms).size).toBe(4)
  })
  it('all five roles have different marks', () => {
    expect(new Set(Object.values(MARK)).size).toBe(5)
    expect(MARK).toEqual({ positive: 'square', recovered: 'diamond', deceased: 'bars', active: 'triangle', rt: 'ring' })
  })
  it('all five roles have their own weave', () => {
    expect(new Set(['positive', 'recovered', 'deceased', 'active', 'rt'].map((r) => weaveFill(r as 'rt'))).size).toBe(5)
  })
  it('dashes come from the brand tokens, deceased is doubled, recovered has round caps', () => {
    expect(lineForm('recovered').dash).toBe('var(--pico-recovered-dash)')
    expect(lineForm('active').dash).toBe('var(--pico-active-dash)')
    expect(lineForm('deceased').doubled).toBe(true)
    expect(lineForm('positive').doubled).toBe(false)
    expect(lineForm('recovered').cap).toBe('round')
  })
})
