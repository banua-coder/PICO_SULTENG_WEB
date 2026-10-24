import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cache } from '@/api/cache'
import { ENDPOINTS } from '@/api/endpoints'
import { vaccinationSeries, vaccineLocations } from '@/api/normalize/vaccination'
import { fx } from '../../../test/fixtures/load'
import { flush, mountApp, until } from '../../../test/support/mount'
import { Select } from '@/components/ui/select'
import VaksinView from './VaksinView.vue'

beforeEach(() => {
  vi.spyOn(window, 'matchMedia').mockImplementation((q) => ({ matches: q.includes('reduce'), media: q, addEventListener: () => undefined, removeEventListener: () => undefined }) as unknown as MediaQueryList)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { width: 640, height: 280, top: 0, left: 0, right: 640, bottom: 280, x: 0, y: 0, toJSON: () => ({}) }
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  cache.clear()
  document.body.innerHTML = ''
})
const seed = () =>
  cache.seed({
    [ENDPOINTS.vaccinationProvince.path]: vaccinationSeries(fx('vaccination-province')),
    [ENDPOINTS.vaccinationNational.path]: vaccinationSeries(fx('vaccination-national')),
    [ENDPOINTS.vaccineLocations.path]: vaccineLocations(fx('vaccine-locations')),
  })
const open = async (path = '/vaksin') => {
  seed()
  const out = await mountApp(VaksinView, {}, path)
  await flush()
  // the charts arrive through lazy chunks
  await until(() => ['doses-over-time'].every((id) => out.wrapper.find(`[data-testid="${id}"] figure`).exists()))
  return out
}

describe('VaksinView', () => {
  it('Sulawesi Tengah: the progress block, Dosis 1 and Dosis 2 columns of six cards, 85,55 % and 53,63 %, the date 25 Maret 2022', async () => {
    const { wrapper } = await open()
    expect(wrapper.find('h1').text()).toBe('Vaksinasi COVID-19')
    const p = wrapper.find('[data-testid="vaccine-progress"]')
    expect(p.find('h2').text()).toContain('Progress Vaksinasi COVID-19')
    const cols = p.findAll('[data-dose]')
    expect(cols.map((c) => c.attributes('data-dose'))).toEqual(['dose1', 'dose2'])
    expect(cols[0]!.findAll('[data-testid="vaccine-progress-card"]').map((c) => c.attributes('data-group'))).toEqual(['total', 'elderly', 'public_officer', 'health_worker', 'public', 'teenager'])
    expect(cols[0]!.find('[data-group="total"] [data-testid="progress-text"]').text()).toContain('85,55%')
    expect(cols[1]!.find('[data-group="total"] [data-testid="progress-text"]').text()).toContain('53,63%')
    expect(wrapper.find('[data-testid="vaccine-cards"]').text()).toContain('Data vaksinasi berhenti diperbarui pada 25 Maret 2022.')
    expect(cols[0]!.find('[data-group="total"] [role="progressbar"]').attributes('aria-valuetext')).toContain('Semua Vaksinasi')
  })

  it('health workers above 100 %: the real percent in the text, the bar stops at 100', async () => {
    const { wrapper } = await open()
    const card = wrapper.find('[data-testid="vaccine-progress"] [data-dose="dose1"] [data-testid="vaccine-progress-card"][data-group="health_worker"]')
    expect(card.find('[data-testid="progress-text"]').text()).toContain('111,2')
    expect(card.find('[data-fill]').attributes('style')).toContain('width: 100%')
  })

  it('doses are told apart by line form, mark and label, not colour only', async () => {
    const { wrapper } = await open()
    const c = wrapper.find('[data-testid="doses-over-time"]')
    const lines = c.findAll('path[data-line]')
    expect(lines).toHaveLength(2)
    expect(lines.map((l) => l.attributes('style')).join(' ')).toMatch(/stroke-dasharray: none/)
    expect(lines.map((l) => l.attributes('style')).join(' ')).toMatch(/stroke-dasharray: 6 4/)
    expect(c.findAll('[data-end-label]').map((e) => e.text())).toEqual(['Dosis 1', 'Dosis 2'])
    expect(new Set(c.findAll('[data-end-label] [data-mark]').map((e) => e.attributes('data-mark'))).size).toBe(2)
  })

  it('?wilayah=indonesia shows the national series; the toggle group writes the query with replace', async () => {
    const { wrapper, router } = await open('/vaksin?wilayah=indonesia')
    expect(wrapper.find('[data-value="indonesia"]').attributes('data-state')).toBe('on')
    await wrapper.find('[data-value="sulawesi-tengah"]').trigger('click')
    await flush()
    expect(router.currentRoute.value.query.wilayah).toBeUndefined()
    await wrapper.find('[data-value="indonesia"]').trigger('click')
    await flush()
    expect(router.currentRoute.value.query.wilayah).toBe('indonesia')
  })

  it('locations: a semantic list with a heading per kabupaten; the filter narrows and keeps focus', async () => {
    const { wrapper } = await open()
    const l = wrapper.find('[data-testid="locations"]')
    expect(l.text()).toContain('Bisa sudah tidak berlaku')
    expect(l.findAll('h3').length).toBeGreaterThan(1)
    expect(l.findAll('ul').length).toBe(l.findAll('h3').length)
    const total = l.findAll('li').length
    expect(total).toBe(36)
    const sel = l.find('#loc-filter')
    ;(sel.element as HTMLElement).focus()
    l.findComponent(Select).vm.$emit('update:modelValue', 'kota-palu')
    await flush()
    expect(l.findAll('h3')).toHaveLength(1)
    expect(l.findAll('li').length).toBeLessThan(total)
    expect(document.activeElement).toBe(sel.element)
    expect(l.text()).toContain('Jenis dosis tidak tercatat') // the first site has neither dose flag
  })

  it('English page and title', async () => {
    const { wrapper } = await open('/en/vaksin')
    expect(wrapper.find('h1').text()).toBe('COVID-19 vaccination')
    expect(wrapper.find('[data-testid="vaccine-cards"]').text()).toContain('Vaccination data stopped being updated on 25 March 2022.')
  })
})
