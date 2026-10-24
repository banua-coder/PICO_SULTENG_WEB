import { describe, expect, it } from 'vitest'
import { fx } from '../../../test/fixtures/load'
import type { WireGenderLatest } from '../wire'
import { genderSnapshot } from './stats'

describe('genderSnapshot', () => {
  it('an age group the source leaves out is null, not a 0 that reads as a count; a real 0 stays 0', () => {
    const wire = fx<WireGenderLatest>('gender-latest')
    const holey = { ...wire, positive: { ...wire.positive, male: { ...wire.positive.male, age_groups: { ...wire.positive.male.age_groups, '15_19': undefined, '20_24': 0 } } } } as unknown as WireGenderLatest
    const ages = genderSnapshot(holey).positive.male.ages
    expect(ages.find((a) => a.key === '15_19')!.count).toBeNull()
    expect(ages.find((a) => a.key === '20_24')!.count).toBe(0)
    expect(ages.find((a) => a.key === '0_14')!.count).toBe(263)
  })
})
