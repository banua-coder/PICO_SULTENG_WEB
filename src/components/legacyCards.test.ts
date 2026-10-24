import { afterEach, describe, expect, it } from 'vitest'
import type { VaccinationDay } from '@/api/types'
import { flush, mountApp } from '../../test/support/mount'
import CaseCard from './CaseCard.vue'
import VaccineCard from './vaccine/VaccineCard.vue'

afterEach(() => (document.body.innerHTML = ''))

describe('CaseCard (the owner\'s CardCase)', () => {
  const columns = [
    { title: 'Sulawesi Tengah', value: 63614, delta: 0, asOf: '2023-12-09' },
    { title: 'Indonesia', value: 6812127, delta: -183, asOf: '2023-07-03' },
  ]
  it('name in capitals in the category colour, two halves with figure, chip and change', async () => {
    const { wrapper } = await mountApp(CaseCard, { state: 'positive', label: 'Positif', columns })
    expect(wrapper.find('h4').text()).toBe('Positif')
    expect(wrapper.find('h4').classes()).toContain('uppercase')
    expect(wrapper.attributes('style')).toContain('var(--pico-positive-ink)')
    const halves = wrapper.findAll('[data-column]')
    expect(halves).toHaveLength(2)
    expect(halves[0]!.find('[data-figure]').text()).toBe('63.614')
    expect(halves[1]!.find('[data-delta]').text()).toContain('−183')
    // the chip carries the exact legacy fill and a chevron: down for a drop, up for 0 or more
    expect(halves[1]!.find('[data-delta] span[style]').attributes('style')).toContain('var(--pico-positive)')
  })
  it('a missing number says so, never 0', async () => {
    const { wrapper } = await mountApp(CaseCard, { state: 'active', label: 'Dirawat', columns: [{ title: 'Kota Palu', value: null, delta: null, asOf: '2023-12-09' }] })
    expect(wrapper.find('[data-figure]').text()).toBe('tidak tersedia')
    expect(wrapper.find('[data-delta]').text()).toBe('') // the one 'tidak tersedia' says it; the change line stays an empty row of the same height
    expect(wrapper.find('[data-figure]').classes()).toContain('text-sm') // small muted text, not the 24 px figure
    expect(wrapper.find('[data-figure]').classes()).toContain('text-ink-muted')
  })
})

const day: VaccinationDay = {
  date: '2022-03-25',
  target: 1000,
  total: { daily: { dose1: 110, dose2: 50 }, cumulative: { dose1: 855, dose2: 536 }, coverage: { dose1: 85.5, dose2: 53.6 } },
  previousDaily: { dose1: 100, dose2: 50 },
  groups: [
    { key: 'health_worker', target: 100, daily: { dose1: 5, dose2: 2 }, cumulative: { dose1: 100, dose2: 90 }, coverage: { dose1: 100, dose2: 90 } },
    { key: 'public_officer', target: 100, daily: { dose1: 5, dose2: 2 }, cumulative: { dose1: 70, dose2: 60 }, coverage: { dose1: 70, dose2: 60 } },
    { key: 'elderly', target: 100, daily: { dose1: 5, dose2: 2 }, cumulative: { dose1: 50, dose2: 30 }, coverage: { dose1: 50, dose2: 30 } },
    { key: 'public', target: 700, daily: { dose1: 5, dose2: 2 }, cumulative: { dose1: 600, dose2: 350 }, coverage: { dose1: 85, dose2: 50 } },
    { key: 'teenager', target: 100, daily: { dose1: 5, dose2: 2 }, cumulative: { dose1: 35, dose2: 6 }, coverage: { dose1: 35, dose2: 6 } },
  ],
}

describe('VaccineCard (the owner\'s CardVaccineHome)', () => {
  it('figure, change with its rate, five segments and five group lines in the legacy order', async () => {
    const { wrapper } = await mountApp(VaccineCard, { day, dose: 'dose1', title: 'Vaksinasi Dosis 1' })
    await flush()
    expect(wrapper.find('[data-figure]').text()).toBe('855')
    expect(wrapper.text()).toContain('+110')
    expect(wrapper.text()).toContain('10') // +10 % against the day before
    expect(wrapper.findAll('[data-segment]').map((s) => s.attributes('data-segment'))).toEqual(['elderly', 'public_officer', 'health_worker', 'public', 'teenager'])
    expect(wrapper.findAll('li[data-group]').map((l) => l.attributes('data-group'))).toEqual(['elderly', 'public_officer', 'health_worker', 'public', 'teenager'])
    expect(wrapper.find('li[data-group="health_worker"]').text()).toContain('100,00%')
    expect(wrapper.find('[data-bar]').attributes('role')).toBe('img')
    expect(wrapper.text()).toContain('dari')
  })
  it('a group above its target stops the bar at 100 %', async () => {
    const over = { ...day, groups: day.groups.map((g) => (g.key === 'elderly' ? { ...g, cumulative: { dose1: 250, dose2: 0 } } : g)) }
    const { wrapper } = await mountApp(VaccineCard, { day: over, dose: 'dose1', title: 'x' })
    expect(wrapper.find('li[data-group="elderly"]').text()).toContain('100,00%')
  })
})
