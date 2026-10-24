import { afterEach, describe, expect, it } from 'vitest'
import { mountApp } from '../../test/support/mount'
import SuspectCard from './SuspectCard.vue'

afterEach(() => (document.body.innerHTML = ''))

describe('SuspectCard (the owner\'s CardSuspect)', () => {
  it('active, finished, total, the shares of the total, and the date', async () => {
    const { wrapper } = await mountApp(SuspectCard, { kind: 'odp', observation: { active: 25, finished: 75, total: 100 }, asOf: '2022-05-08' })
    expect(wrapper.find('h4').text()).toBe('Orang Dalam Pemantauan (ODP)')
    expect(wrapper.text()).toContain('Dalam Pemantauan')
    expect(wrapper.text()).toContain('Selesai Pemantauan')
    expect(wrapper.find('[data-active]').text()).toBe('25')
    expect(wrapper.find('[data-active-share]').text()).toBe('25,00%')
    expect(wrapper.find('[data-finished-share]').text()).toBe('75,00%')
    expect(wrapper.find('[data-total]').text()).toBe('100')
    expect(wrapper.text()).toContain('8 Mei 2022')
  })
  it('a zero total shows no share (never NaN), a missing figure says so (never 0)', async () => {
    const { wrapper } = await mountApp(SuspectCard, { kind: 'pdp', observation: { active: null, finished: 0, total: 0 }, asOf: '2022-05-08' })
    expect(wrapper.text()).not.toContain('NaN')
    expect(wrapper.find('[data-active]').text()).toBe('tidak tersedia')
    expect(wrapper.find('[data-finished-share]').text()).toBe('')
  })
  it('no observation at all: "tidak tersedia"', async () => {
    const { wrapper } = await mountApp(SuspectCard, { kind: 'pdp', observation: null, asOf: '2022-05-08' })
    expect(wrapper.find('[data-none]').text()).toBe('tidak tersedia')
  })
})
