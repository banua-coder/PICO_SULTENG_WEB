import type { Role } from '../types'

/**
 * How each data role is drawn besides its colour (DESIGN.md): a line form, a mark, a weave.
 * Dashes come from the brand tokens (--pico-<role>-dash). Deceased is doubled (two 1.5 px threads).
 */
export const LINE_ROLES = ['positive', 'recovered', 'deceased', 'active'] as const
export const MARK: Record<Role, 'square' | 'diamond' | 'bars' | 'triangle' | 'ring'> = {
  positive: 'square',
  recovered: 'diamond',
  deceased: 'bars',
  active: 'triangle',
  rt: 'ring',
}

export type LineForm = { dash: string; doubled: boolean; cap: 'butt' | 'round' }
export const lineForm = (role: Role): LineForm => ({
  dash: `var(--pico-${role}-dash)`,
  doubled: role === 'deceased',
  cap: role === 'recovered' ? 'round' : 'butt', // the dotted line is 0.1-long dashes: round caps make the dots
})

export const roleFill = (role: Role) => `var(--pico-${role})`
