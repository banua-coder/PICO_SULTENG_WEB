import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INDONESIA, SULTENG } from '@/app/areas'
import { flush, mountApp } from '../../test/support/mount'
import AreaPicker from './AreaPicker.vue'
import DateRange from './DateRange.vue'
import LottiePlayer from './LottiePlayer.vue'
import { hexToLottie, recolor } from './lottie'
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
    expect(wrapper.find('svg').exists()).toBe(true)
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

describe('LottiePlayer', () => {
  it('with reduced motion it shows the static SVG and never requests lottie-web', async () => {
    motion(true)
    const { wrapper } = await mountApp(LottiePlayer, { name: 'success', label: 'Berhasil' })
    await flush()
    expect(lottieLoaded).not.toHaveBeenCalled()
    expect(wrapper.find('svg').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Berhasil')
  })

  it('with motion allowed it lazy-loads the player', async () => {
    motion(false)
    await mountApp(LottiePlayer, { name: 'success', label: 'Berhasil' })
    await flush()
    expect(lottieLoaded).toHaveBeenCalled()
  })
})

describe('lottie recolour', () => {
  it('parses hex to 0..1 floats', () => {
    expect(hexToLottie('#FF0000')).toEqual([1, 0, 0, 1])
    expect(hexToLottie('#9DB0EE')?.[0]).toBeCloseTo(0.616, 2)
    expect(hexToLottie('red')).toBeNull()
  })

  it('recolours only named fills and strokes, deep in the tree, from CSS variables', () => {
    const data = {
      layers: [
        { shapes: [{ ty: 'st', nm: 'pico-primary', c: { k: [0, 0, 0, 1] } }, { ty: 'fl', nm: 'other', c: { k: [0.1, 0.1, 0.1, 1] } }] },
        { shapes: [{ ty: 'fl', nm: 'pico-crimson', c: { k: [0, 0, 0, 1] } }] },
      ],
    }
    recolor(data, (n) => ({ '--pico-primary': '#77A2DA', '--pico-crimson': '#F08AAE' })[n] ?? '')
    expect(data.layers[0]!.shapes[0]!.c.k).toEqual(hexToLottie('#77A2DA'))
    expect(data.layers[0]!.shapes[1]!.c.k).toEqual([0.1, 0.1, 0.1, 1])
    expect(data.layers[1]!.shapes[0]!.c.k).toEqual(hexToLottie('#F08AAE'))
  })

  it('leaves a colour alone when the variable is not a hex', () => {
    const d = { ty: 'fl', nm: 'pico-sky', c: { k: [1, 1, 1, 1] } }
    recolor(d, () => '')
    expect(d.c.k).toEqual([1, 1, 1, 1])
  })
})

describe('AreaPicker', () => {
  it('has native optgroups for each requested level: 1 + 34 + 13 options', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: SULTENG, levels: ['indonesia', 'provinsi', 'kabupaten'] })
    expect(wrapper.findAll('optgroup')).toHaveLength(3)
    expect(wrapper.findAll('option')).toHaveLength(48)
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('provinsi:sulawesi-tengah')
    expect(wrapper.find('label').text()).toBe('Wilayah')
  })

  it('only the requested levels appear', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: SULTENG, levels: ['provinsi'] })
    expect(wrapper.findAll('optgroup')).toHaveLength(1)
    expect(wrapper.findAll('option')).toHaveLength(34)
  })

  it('emits the AreaRef of the chosen option', async () => {
    const { wrapper } = await mountApp(AreaPicker, { modelValue: INDONESIA, levels: ['indonesia', 'kabupaten'] })
    await wrapper.find('select').setValue('kabupaten:kota-palu')
    const out = wrapper.findComponent(AreaPicker).emitted('update:modelValue')![0]![0]
    expect(out).toMatchObject({ level: 'kabupaten', code: '7271', name: 'Kota Palu' })
  })
})

describe('DateRange', () => {
  const win = { from: '2020-03-02', to: '2024-01-14' }
  const props = { modelValue: win, min: '2020-03-02', max: '2024-01-14' }
  const emitted = (w: Awaited<ReturnType<typeof mountApp>>['wrapper']) => w.findComponent(DateRange).emitted('update:modelValue')!.at(-1)![0] as { from: string; to: string }

  it('has two labelled native date inputs inside a fieldset with a legend', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    expect(wrapper.find('legend').text()).toBe('Rentang tanggal')
    const inputs = wrapper.findAll('input[type="date"]')
    expect(inputs).toHaveLength(2)
    expect(inputs[0]!.attributes('min')).toBe('2020-03-02')
    for (const i of inputs) expect(wrapper.find(`label[for="${i.attributes('id')}"]`).exists()).toBe(true)
  })

  it('presets: semua, 2020, 2021, 2022, 2023, 2024 clamped to the data window', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    const buttons = wrapper.findAll('button')
    expect(buttons.map((b) => b.text())).toEqual(['Semua', '2020', '2021', '2022', '2023', '2024'])
    await buttons[1]!.trigger('click')
    expect(emitted(wrapper)).toEqual({ from: '2020-03-02', to: '2020-12-31' }) // 2020 starts at the data's first day
    await buttons[5]!.trigger('click')
    expect(emitted(wrapper)).toEqual({ from: '2024-01-01', to: '2024-01-14' })
    await buttons[0]!.trigger('click')
    expect(emitted(wrapper)).toEqual(win)
  })

  it('marks the active preset with aria-pressed', async () => {
    const all = await mountApp(DateRange, props)
    expect(all.wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('true')
    const y = await mountApp(DateRange, { ...props, modelValue: { from: '2021-01-01', to: '2021-12-31' } })
    expect(y.wrapper.findAll('button').find((b) => b.text() === '2021')!.attributes('aria-pressed')).toBe('true')
    expect(y.wrapper.findAll('button')[0]!.attributes('aria-pressed')).toBe('false')
  })

  it('clamps typed dates to min and max', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    await wrapper.findAll('input')[0]!.setValue('2019-01-01')
    expect(emitted(wrapper).from).toBe('2020-03-02')
    await wrapper.findAll('input')[1]!.setValue('2030-01-01')
    expect(emitted(wrapper).to).toBe('2024-01-14')
  })

  it('a start after the end drags the end along, and the reverse', async () => {
    const mid = { from: '2021-01-01', to: '2021-06-30' }
    const { wrapper } = await mountApp(DateRange, { ...props, modelValue: mid })
    await wrapper.findAll('input')[0]!.setValue('2021-09-01')
    expect(emitted(wrapper)).toEqual({ from: '2021-09-01', to: '2021-09-01' })
    await wrapper.findAll('input')[1]!.setValue('2020-12-01')
    expect(emitted(wrapper)).toEqual({ from: '2020-12-01', to: '2020-12-01' })
  })

  it('ignores an empty value while the user is editing', async () => {
    const { wrapper } = await mountApp(DateRange, props)
    await wrapper.findAll('input')[0]!.setValue('')
    expect(wrapper.findComponent(DateRange).emitted('update:modelValue')).toBeUndefined()
  })
})
