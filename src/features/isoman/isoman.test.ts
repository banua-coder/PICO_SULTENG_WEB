import { afterEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/api/cache'
import { ENDPOINTS } from '@/api/endpoints'
import { donations as toDonations, telemedicines as toTele } from '@/api/normalize/content'
import type { Donation, Telemedicine } from '@/api/types'
import { fx, type WireDonation, type WireTelemedicine } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import { Select } from '@/components/ui/select'
import IsomanView from './IsomanView.vue'
import { parseDays, worksOn } from './useScheduleFilter'

Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => false, configurable: true })
afterEach(() => cache.clear())
const tele = () => toTele(fx<WireTelemedicine[]>('telemedicines'))
const donations = () => toDonations(fx<WireDonation[]>('donations'))
const seed = (t: Telemedicine[] = tele(), d: Donation[] = donations()) => cache.seed({ [ENDPOINTS.telemedicines.path]: t, [ENDPOINTS.donations.path]: d })
const doc = (days: string) => ({ schedules: [{ days, hours: '08:00-20:00', tz: 'WIB' }] })
const [MON, TUE, WED, THU, FRI, SAT, SUN] = [1, 2, 3, 4, 5, 6, 7]

describe('useScheduleFilter', () => {
  it('"Senin-Jumat" matches Rabu, "Senin-Kamis" does not match Jumat', () => {
    expect(worksOn(doc('Senin-Jumat'), WED)).toBe(true)
    expect(worksOn(doc('Senin-Kamis'), FRI)).toBe(false)
    expect(worksOn(doc('Senin-Kamis'), THU)).toBe(true)
  })
  it('single days, spaced ranges, every day and wrap-around', () => {
    expect(worksOn(doc('Jumat'), FRI)).toBe(true)
    expect(worksOn(doc('Jumat'), SAT)).toBe(false)
    expect(worksOn(doc('Senin - Sabtu'), SUN)).toBe(false)
    expect(worksOn(doc('Senin - Sabtu'), SAT)).toBe(true)
    expect(worksOn(doc('Setiap Hari'), SUN)).toBe(true)
    expect([...parseDays('Jumat-Senin')!].sort()).toEqual([1, 5, 6, 7])
    expect(worksOn(doc('Jumat-Senin'), TUE)).toBe(false)
    expect(worksOn(doc('Jumat-Senin'), MON)).toBe(true)
  })
  it('unparseable text, and no schedule at all, match every day', () => {
    for (const d of [MON, WED, SUN]) {
      expect(worksOn(doc('Hubungi via chat'), d)).toBe(true)
      expect(worksOn({ schedules: [] }, d)).toBe(true)
    }
    expect(parseDays('Senin-Hari')).toBeNull()
    expect(parseDays('')).toBeNull()
  })
  it('one parsing schedule is enough, and a list of days works', () => {
    const two = { schedules: [{ days: 'Senin', hours: '', tz: '' }, { days: 'Rabu, Jumat', hours: '', tz: '' }] }
    expect([MON, TUE, WED, FRI].map((d) => worksOn(two, d))).toEqual([true, false, true, true])
  })
  it('every day string in the fixtures parses', () => {
    for (const t of tele()) for (const s of t.schedules) expect(parseDays(s.days), s.days).not.toBeNull()
  })
})

describe('IsomanView, legacy order', () => {
  it('four cards (the survey one says it is inactive), four care boxes, the guide sections, then donations, then doctors', async () => {
    seed()
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    const ctas = wrapper.findAll('[data-cta]')
    expect(ctas.map((c) => c.attributes('data-cta'))).toEqual(['tele', 'survey', 'faq', 'donasi'])
    expect(wrapper.find('[data-cta="survey"] [data-inactive]').text()).toContain('tidak aktif lagi')
    expect(wrapper.find('[data-cta="survey"] a').exists()).toBe(false)
    expect(wrapper.findAll('[data-category]').map((c) => c.attributes('data-category'))).toEqual(['Tanpa Gejala', 'Ringan', 'Sedang', 'Berat-Kritis'])
    const ids = wrapper.findAll('section[data-testid^="isoman-"]').map((s) => s.attributes('data-testid'))
    expect(ids).toEqual(['isoman-perawatan', 'isoman-rumah', 'isoman-kontak-erat', 'isoman-bebas', 'isoman-pcr-ulang', 'isoman-donasi', 'isoman-telemedicine'])
    expect(wrapper.text()).toContain('Panduan masa pandemi')
  })
})

describe('IsomanView', () => {
  it('the archive notice is the first content after the h1, and the danger signs lead the guide', async () => {
    seed()
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    const root = wrapper.find('div.px-4')
    expect(root.element.children[0]!.tagName).toBe('H1')
    expect(root.element.children[1]!.getAttribute('data-testid')).toBe('archive-notice')
    expect(wrapper.find('[data-testid="archive-notice"]').text()).toContain('Jangan mengirim uang')
    expect(wrapper.findAll('h2')[0]!.text()).toContain('Tanda bahaya')
    expect(wrapper.findAll('[data-todo]')).toHaveLength(0)
    expect(wrapper.text()).toContain('Hubungi 119')
  })

  it('the day filter narrows the doctors and says how many', async () => {
    seed()
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    const total = tele().length
    expect(wrapper.findAll('[data-testid="telemedicine-grid"] article')).toHaveLength(total)
    wrapper.findComponent(Select).vm.$emit('update:modelValue', '7') // Minggu
    await flush()
    const expected = tele().filter((t) => worksOn(t, 7)).length
    expect(expected).toBeLessThan(total)
    expect(wrapper.findAll('[data-testid="telemedicine-grid"] article')).toHaveLength(expected)
    expect(wrapper.text()).toContain(`Menampilkan ${expected} dari ${total} dokter`)
  })

  it('with null logos and images all 8 donations render, with the bank as text and no "null"', async () => {
    const d = donations().map((x) => ({ ...x, image: null, deliveryAddress: null, accounts: x.accounts.map((a) => ({ ...a, logo: null })) }))
    seed(tele(), d)
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    const cards = wrapper.findAll('[data-testid="donation-grid"] article')
    expect(cards).toHaveLength(8)
    for (const c of cards) expect(c.find('[data-placeholder]').exists()).toBe(false) // no picture, no empty box
    expect(wrapper.find('[data-testid="donation-grid"]').findAll('img')).toHaveLength(0)
    expect(wrapper.find('[data-testid="donation-grid"]').text()).toContain(d[0]!.accounts[0]!.bank)
    expect(wrapper.text().toLowerCase()).not.toContain('null')
  })

  it('the delivery address line shows only when goods are accepted and an address exists', async () => {
    const base = donations()[0]!
    seed(tele(), [{ ...base, acceptsGoods: true, deliveryAddress: null }, { ...base, id: 99, acceptsGoods: true, deliveryAddress: 'Jl. Contoh 1' }])
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    const cards = wrapper.findAll('[data-testid="donation-grid"] article')
    expect(cards[0]!.text()).not.toContain('Alamat pengiriman')
    expect(cards[1]!.text()).toContain('Alamat pengiriman: Jl. Contoh 1')
  })

  it('copying an account number copies digits only and announces "Nomor rekening disalin"', async () => {
    const base = donations()[0]!
    seed(tele(), [{ ...base, accounts: [{ bank: 'Bank X', bankShort: 'BX', number: '123-456 789', holder: 'Budi', logo: null }] }])
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { wrapper } = await mountApp(IsomanView, {}, '/isoman')
    await flush()
    await wrapper.find('[data-testid="donation-grid"] button').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith('123456789')
    expect(wrapper.find('[data-testid="donation-grid"] [role="status"]').text()).toBe('Nomor rekening disalin')
  })
})
