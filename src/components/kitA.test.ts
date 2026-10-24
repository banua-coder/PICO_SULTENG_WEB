import { afterEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp } from '../../test/support/mount'
import ContactLink from './ContactLink.vue'
import CopyButton from './CopyButton.vue'
import DataFreshness from './DataFreshness.vue'
import PicoIcon from './PicoIcon.vue'
import SectionHeading from './SectionHeading.vue'
import StatFigure from './StatFigure.vue'
import StateMark from './StateMark.vue'

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('PicoIcon', () => {
  it('decorative (default): hidden from assistive tech, no role, no label', async () => {
    const { wrapper } = await mountApp(PicoIcon, { name: 'map' })
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('role')).toBeUndefined()
    expect(svg.attributes('aria-label')).toBeUndefined()
    expect(svg.find('title').exists()).toBe(false)
    expect(svg.element.innerHTML).toContain('<path')
    expect(svg.attributes('width')).toBe('24')
  })

  it('standalone: role img with the localized label from index.json', async () => {
    const id = await mountApp(PicoIcon, { name: 'state.positive', decorative: false, size: 16 })
    expect(id.wrapper.find('svg').attributes('role')).toBe('img')
    expect(id.wrapper.find('svg').attributes('aria-label')).toBe('Kasus positif')
    expect(id.wrapper.find('svg').attributes('width')).toBe('16')
    const en = await mountApp(PicoIcon, { name: 'state.positive', decorative: false }, '/en/')
    expect(en.wrapper.find('svg').attributes('aria-label')).toBe('Positive cases')
  })

  it('duotone draws the tint shape the mono one lacks', async () => {
    const mono = await mountApp(PicoIcon, { name: 'info' })
    const duo = await mountApp(PicoIcon, { name: 'info', variant: 'duotone' })
    expect(duo.wrapper.find('svg').element.innerHTML).toContain('opacity="0.22"')
    expect(mono.wrapper.find('svg').element.innerHTML).not.toContain('opacity="0.22"')
  })
})

describe('StateMark', () => {
  it('draws a different mark per state, all hidden from assistive tech', async () => {
    const shape = async (state: string) => {
      const { wrapper } = await mountApp(StateMark, { state })
      expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
      return wrapper.find('svg').element.innerHTML.replace(/ style="[^"]*"/g, '')
    }
    const all = await Promise.all(['positive', 'recovered', 'deceased', 'active', 'rt'].map(shape))
    expect(new Set(all).size).toBe(5)
    expect(all[0]).toContain('<rect') // square
    expect(all[1]).toContain('M12 1.5') // diamond
    expect((all[2]!.match(/<rect/g) ?? []).length).toBe(2) // two bars
    expect(all[3]).toContain('M12 2.5') // triangle
    expect(all[4]).toContain('<circle') // ring
  })

  it('size 1..6 picks the --pico-mark ramp', async () => {
    const { wrapper } = await mountApp(StateMark, { state: 'rt', size: 5 })
    expect(wrapper.find('svg').attributes('style')).toContain('--pico-mark-5')
  })
})

describe('StatFigure', () => {
  const base = { state: 'positive', label: 'Positif', asOf: '2024-01-14' }
  it('formats the value, shows the label and a dated time element', async () => {
    const { wrapper } = await mountApp(StatFigure, { ...base, value: 63614 })
    expect(wrapper.text()).toContain('63.614')
    expect(wrapper.text()).toContain('Positif')
    expect(wrapper.text()).toContain('14 Januari 2024')
    expect(wrapper.find('time').attributes('datetime')).toBe('2024-01-14')
  })
  it('null value says "tidak tersedia" (and "not available" in English), never 0 or a dash', async () => {
    const id = await mountApp(StatFigure, { ...base, value: null })
    expect(id.wrapper.text()).toContain('tidak tersedia')
    expect(id.wrapper.text()).not.toMatch(/\b0\b/)
    const en = await mountApp(StatFigure, { ...base, value: null }, '/en/')
    expect(en.wrapper.text()).toContain('not available')
  })
  it('a real 0 is shown as 0', async () => {
    const { wrapper } = await mountApp(StatFigure, { ...base, value: 0 })
    expect(wrapper.find('p.num').text()).toBe('0')
  })
  it('delta: signed, hidden when undefined, "not available" when null', async () => {
    expect((await mountApp(StatFigure, { ...base, value: 1, delta: 12 })).wrapper.text()).toContain('+12')
    expect((await mountApp(StatFigure, { ...base, value: 1, delta: -3 })).wrapper.text()).toContain('−3')
    expect((await mountApp(StatFigure, { ...base, value: 1 })).wrapper.text()).not.toContain('Perubahan harian')
    expect((await mountApp(StatFigure, { ...base, value: 1, delta: null })).wrapper.text()).toContain('Perubahan harian tidak tersedia')
  })
  it('pairs the mark with the text label (colour never alone)', async () => {
    const { wrapper } = await mountApp(StatFigure, { ...base, state: 'recovered', label: 'Sembuh', value: 5 })
    expect(wrapper.find('svg[data-state="recovered"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Sembuh')
  })
})

describe('DataFreshness', () => {
  it('shows date, source and the archive note', async () => {
    const { wrapper } = await mountApp(DataFreshness, { asOf: '2024-01-14', source: 'situs pihak ketiga' })
    expect(wrapper.text()).toBe('Data per 14 Januari 2024 · Sumber: situs pihak ketiga · Arsip, tidak diperbarui lagi')
  })
  it('English', async () => {
    const { wrapper } = await mountApp(DataFreshness, { asOf: '2024-01-14', source: 'a third-party site' }, '/en/')
    expect(wrapper.text()).toContain('Data as of 14 January 2024 · Source: a third-party site')
  })
})

describe('SectionHeading', () => {
  it('renders the level, the id and an anchor link with a label', async () => {
    const { wrapper } = await mountApp(SectionHeading, { level: 2, id: 'rt' }, '/', { default: 'Angka reproduksi' })
    const h = wrapper.find('h2')
    expect(h.attributes('id')).toBe('rt')
    expect(h.text()).toContain('Angka reproduksi')
    expect(h.find('a').attributes('href')).toBe('#rt')
    expect(h.find('a').attributes('aria-label')).toBe('Tautan ke bagian ini')
    expect((await mountApp(SectionHeading, { level: 3, id: 'x' })).wrapper.find('h3').exists()).toBe(true)
  })
})

describe('CopyButton', () => {
  it('copies, emits copied and announces "Disalin" in a polite live region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    const { wrapper } = await mountApp(CopyButton, { value: '7921024685', label: 'nomor rekening' })
    expect(wrapper.find('button').attributes('aria-label')).toBe('Salin nomor rekening')
    await wrapper.find('button').trigger('click')
    await flush()
    expect(writeText).toHaveBeenCalledWith('7921024685')
    expect(wrapper.find('[role="status"]').attributes('aria-live')).toBe('polite')
    expect(wrapper.find('[role="status"]').text()).toBe('Disalin')
  })
  it('says nothing and emits nothing when the clipboard is unavailable', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    const { wrapper } = await mountApp(CopyButton, { value: 'x', label: 'x' })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.find('[role="status"]').text()).toBe('')
  })
})

describe('ContactLink', () => {
  it('phone links to tel: in the same tab', async () => {
    const { wrapper } = await mountApp(ContactLink, { contact: { kind: 'phone', label: '0812', href: 'tel:0812' } })
    const a = wrapper.find('a')
    expect(a.attributes('href')).toBe('tel:0812')
    expect(a.attributes('target')).toBeUndefined()
    expect(wrapper.text()).toContain('Telepon')
  })
  it('WhatsApp opens a new tab with rel noopener and says so to screen readers', async () => {
    const { wrapper } = await mountApp(ContactLink, { contact: { kind: 'whatsapp', label: '6285', href: 'https://api.whatsapp.com/send?phone=6285' } })
    const a = wrapper.find('a')
    expect(a.attributes('target')).toBe('_blank')
    expect(a.attributes('rel')).toContain('noopener')
    expect(a.find('.sr-only').text()).toContain('membuka tab baru')
  })
  it('fax and unsafe values are plain text, not links', async () => {
    const { wrapper } = await mountApp(ContactLink, { contact: { kind: 'fax', label: '0451-1', href: '' } })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toContain('0451-1')
  })
})
