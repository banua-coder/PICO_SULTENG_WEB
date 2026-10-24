import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INDONESIA, SULTENG } from '@/app/areas'
import { flush, mountApp, until } from '../../test/support/mount'
import { Select } from '@/components/ui/select'
import AreaPicker from './AreaPicker.vue'
import DateRange from './DateRange.vue'
import PicoImage from './PicoImage.vue'
import StatusView from './StatusView.vue'

const lottieLoaded = vi.fn()
vi.mock('lottie-web/build/player/lottie_light', () => {
  lottieLoaded()
  return { default: { loadAnimation: vi.fn(() => ({ destroy: vi.fn() })) } }
})

const motion = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), addEventListener: vi.fn(), removeEventListener: vi.fn() }))

// happy-dom reports every image as complete with width 0. Real browsers say complete=false while loading.
const imgState = { complete: false, naturalWidth: 0 }
Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => imgState.complete, configurable: true })
Object.defineProperty(HTMLImageElement.prototype, 'naturalWidth', { get: () => imgState.naturalWidth, configurable: true })

beforeEach(() => {
  lottieLoaded.mockClear()
  Object.assign(imgState, { complete: false, naturalWidth: 0 })
})
afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('PicoImage', () => {
  const props = { alt: 'Panduan Isolasi Mandiri', ratio: '16/9' }
  const box = (w: { find: (s: string) => { attributes: (n: string) => string | undefined } }) => w.find('div').attributes('style')

  it('shows the image when there is a src', async () => {
    const { wrapper } = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/a.jpg' })
    expect(wrapper.find('img').attributes('src')).toBe('https://i.ibb.co/a.jpg')
    expect(wrapper.find('img').attributes('alt')).toBe('Panduan Isolasi Mandiri')
  })

  it('src=null shows the woven plate, never a broken-image icon', async () => {
    const { wrapper } = await mountApp(PicoImage, { ...props, src: null })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-placeholder="plate"]').attributes('aria-label')).toContain('Gambar tidak tersedia')
  })

  it('a load error (404 or a blocked host) swaps to the placeholder', async () => {
    const { wrapper } = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/blocked.jpg' })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-placeholder]').exists()).toBe(true)
  })

  it('an image that failed before hydration attached the listener is caught after mount', async () => {
    Object.assign(imgState, { complete: true, naturalWidth: 0 })
    const { wrapper } = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/blocked.jpg' })
    await flush()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-placeholder]').exists()).toBe(true)
  })

  it('a loaded image stays', async () => {
    Object.assign(imgState, { complete: true, naturalWidth: 640 })
    const { wrapper } = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/a.jpg' })
    await flush()
    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('initials fallback uses the first letters of the name', async () => {
    const { wrapper } = await mountApp(PicoImage, { alt: 'Untuk Kawan Baik', ratio: '1/1', src: null, fallback: 'initials' })
    expect(wrapper.find('[data-placeholder="initials"]').text()).toBe('UK')
  })

  it('the box has the same fixed ratio in all three cases, so nothing shifts (CLS 0)', async () => {
    const ok = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/a.jpg' })
    const nul = await mountApp(PicoImage, { ...props, src: null })
    const bad = await mountApp(PicoImage, { ...props, src: 'https://i.ibb.co/b.jpg' })
    await bad.wrapper.find('img').trigger('error')
    expect(box(ok.wrapper)).toContain('aspect-ratio: 16 / 9')
    expect(box(nul.wrapper)).toBe(box(ok.wrapper))
    expect(box(bad.wrapper)).toBe(box(ok.wrapper))
  })

  it('lazy by default, eager on request', async () => {
    expect((await mountApp(PicoImage, { ...props, src: 'https://x.id/a.jpg' })).wrapper.find('img').attributes('loading')).toBe('lazy')
    expect((await mountApp(PicoImage, { ...props, src: 'https://x.id/a.jpg', loading: 'eager' })).wrapper.find('img').attributes('loading')).toBe('eager')
  })
})

describe('StatusView', () => {
  it.each([
    ['empty', 'Belum ada data'],
    ['error', 'Data gagal dimuat'],
    ['offline', 'Tidak ada koneksi'],
    ['not-found', 'Halaman tidak ditemukan'],
  ])('%s shows its illustration and localized title', async (kind, title) => {
    motion(false)
    const { wrapper } = await mountApp(StatusView, { kind })
    await flush()
    expect(wrapper.text()).toContain(title)
    await until(() => wrapper.find('svg').exists()) // the illustration arrives through a lazy chunk
  })

  it('English titles', async () => {
    const { wrapper } = await mountApp(StatusView, { kind: 'offline' }, '/en/')
    expect(wrapper.text()).toContain('No connection')
    expect(wrapper.text()).toContain('Try again')
  })

  it('error and offline have a retry button that emits retry. empty and not-found do not', async () => {
    for (const kind of ['error', 'offline'])
      expect((await mountApp(StatusView, { kind })).wrapper.find('button').exists()).toBe(true)
    for (const kind of ['empty', 'not-found'])
      expect((await mountApp(StatusView, { kind })).wrapper.find('button').exists()).toBe(false)
    const { wrapper } = await mountApp(StatusView, { kind: 'error' })
    await wrapper.find('button').trigger('click')
    expect(wrapper.findComponent(StatusView).emitted('retry')).toHaveLength(1)
  })

  it('error is announced as an alert, loading as a status; a custom title wins', async () => {
    motion(true)
    expect((await mountApp(StatusView, { kind: 'error' })).wrapper.find('[role="alert"]').exists()).toBe(true)
    const loading = await mountApp(StatusView, { kind: 'loading', title: 'Menunggu' })
    expect(loading.wrapper.find('[role="status"]').exists()).toBe(true)
    expect(loading.wrapper.text()).toContain('Menunggu')
  })

  it('the actions slot is rendered', async () => {
    const { wrapper } = await mountApp(StatusView, { kind: 'empty' }, '/', { actions: '<a href="/data">Ke Data</a>' })
    expect(wrapper.html()).toContain('Ke Data')
  })
})

describe('AreaPicker', () => {
  it('is a labelled shadcn select showing the current area', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: SULTENG, levels: ['indonesia', 'provinsi', 'kabupaten'] })
    expect(wrapper.find('label').text()).toBe('Wilayah')
    const trigger = wrapper.find('button[role="combobox"]')
    expect(trigger.exists()).toBe(true)
    expect(trigger.text()).toBe('Sulawesi Tengah')
    expect(wrapper.find('label').attributes('for')).toBe(trigger.attributes('id'))
  })

  it('emits the AreaRef of the chosen value', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: INDONESIA, levels: ['indonesia', 'kabupaten'] })
    wrapper.findComponent(Select).vm.$emit('update:modelValue', 'kabupaten:kota-palu')
    const out = wrapper.findComponent(AreaPicker).emitted('update:modelValue')![0]![0]
    expect(out).toMatchObject({ level: 'kabupaten', code: '7271', name: 'Kota Palu' })
  })

  it('ignores a value that is not an area', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: INDONESIA, levels: ['indonesia'] })
    wrapper.findComponent(Select).vm.$emit('update:modelValue', 'provinsi:nowhere')
    expect(wrapper.findComponent(AreaPicker).emitted('update:modelValue')).toBeUndefined()
  })
})

describe('DateRange', () => {
  // the last day with real counts is the end of the window, not the padded end of the record
  const win = { from: '2020-03-02', to: '2023-12-09' }
  const props = { modelValue: win, min: '2020-03-02', max: '2023-12-09' }
  const emitted = (w: Awaited<ReturnType<typeof mountApp>>['wrapper']) => w.findComponent(DateRange).emitted('update:modelValue')!.at(-1)![0] as { from: string; to: string }
  const frames = (w: Awaited<ReturnType<typeof mountApp>>['wrapper']) => w.findAll('[data-slot="toggle-group-item"]')

  it('time frames: 30, 90, 180 days and Semua, counted back from the last real day', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    expect(frames(wrapper).map((b) => b.text())).toEqual(['30 hari', '90 hari', '180 hari', 'Semua'])
    await frames(wrapper)[0]!.trigger('click')
    expect(emitted(wrapper)).toEqual({ from: '2023-11-10', to: '2023-12-09' }) // 30 days, both ends included
    await frames(wrapper)[1]!.trigger('click')
    expect(emitted(wrapper)).toEqual({ from: '2023-09-11', to: '2023-12-09' })
    await frames(wrapper)[2]!.trigger('click')
    expect(emitted(wrapper)).toEqual({ from: '2023-06-13', to: '2023-12-09' })
  })

  it('Semua is the whole data window, and a window longer than the data is clamped to its first day', async () => {
    const { wrapper } = await mountApp(DateRange, { ...props, modelValue: { from: '2023-11-10', to: '2023-12-09' } })
    await frames(wrapper)[3]!.trigger('click')
    expect(emitted(wrapper)).toEqual(win)
    const short = await mountApp(DateRange, { modelValue: { from: '2023-12-01', to: '2023-12-09' }, min: '2023-12-01', max: '2023-12-09' })
    await frames(short.wrapper)[2]!.trigger('click')
    expect(emitted(short.wrapper)).toEqual({ from: '2023-12-01', to: '2023-12-09' })
  })

  it('marks the active time frame (data-state on)', async () => {
    const all = await mountApp(DateRange, props)
    expect(frames(all.wrapper)[3]!.attributes('data-state')).toBe('on')
    const d30 = await mountApp(DateRange, { ...props, modelValue: { from: '2023-11-10', to: '2023-12-09' } })
    expect(frames(d30.wrapper)[0]!.attributes('data-state')).toBe('on')
    expect(frames(d30.wrapper)[3]!.attributes('data-state')).toBe('off')
  })

  it('the year select shows the year of the window, and the calendar button shows the dates', async () => {
    const y = await mountApp(DateRange, { ...props, modelValue: { from: '2021-01-01', to: '2021-12-31' } })
    expect(y.wrapper.find('button[role="combobox"]').text()).toBe('2021')
    await until(() => y.wrapper.find('[data-testid="range-trigger"]').exists()) // the calendar is its own chunk
    expect(y.wrapper.find('[data-testid="range-trigger"]').text()).toContain('1 Januari 2021 sampai 31 Desember 2021')
  })

  it('a year is picked from the select: clamped to the data window', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    wrapper.findComponent(Select).vm.$emit('update:modelValue', '2020')
    expect(emitted(wrapper)).toEqual({ from: '2020-03-02', to: '2020-12-31' }) // 2020 starts at the data's first day
    wrapper.findComponent(Select).vm.$emit('update:modelValue', '2023')
    expect(emitted(wrapper)).toEqual({ from: '2023-01-01', to: '2023-12-09' })
    wrapper.findComponent(Select).vm.$emit('update:modelValue', 'all')
    expect(emitted(wrapper)).toEqual(win)
  })
})
