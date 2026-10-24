import { afterEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp, until } from '../../test/support/mount'
import LottieMoment from './LottieMoment.vue'
import StatusView from './StatusView.vue'

const play = vi.fn()
vi.mock('./lottie/player', () => ({ play: (...a: unknown[]) => play(...a) }))

class IO {
  static last: IO
  constructor(public cb: (e: { isIntersecting: boolean }[]) => void) { IO.last = this }
  observe() {}
  disconnect() {}
}
const media = (reduce: boolean) =>
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }))

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
  play.mockReset()
})

describe('LottieMoment', () => {
  it('shows the poster first and loads the player only once it is in view', async () => {
    media(false)
    vi.stubGlobal('IntersectionObserver', IO)
    play.mockResolvedValue({ destroy() {} })
    const { wrapper } = await mountApp(LottieMoment, { name: 'success' })
    await flush()
    expect(wrapper.findAll('img').map((i) => i.attributes('src'))).toEqual(['/lottie/posters/success.svg', '/lottie/posters/success-dark.svg'])
    expect(play).not.toHaveBeenCalled()
    IO.last.cb([{ isIntersecting: true }])
    await flush()
    expect(play).toHaveBeenCalledOnce()
    expect(play.mock.calls[0]![0]).toMatchObject({ name: 'success', loop: false })
  })
  it('never loads the player under reduced motion; the poster stays', async () => {
    media(true)
    vi.stubGlobal('IntersectionObserver', IO)
    const { wrapper } = await mountApp(LottieMoment, { name: 'handwash-loop' })
    await flush()
    IO.last.cb([{ isIntersecting: true }])
    await flush()
    expect(play).not.toHaveBeenCalled()
    expect(wrapper.find('img').isVisible()).toBe(true)
  })
  it('a failing player leaves the poster (no error for the visitor)', async () => {
    media(false)
    vi.stubGlobal('IntersectionObserver', IO)
    play.mockRejectedValue(new Error('offline'))
    const { wrapper } = await mountApp(LottieMoment, { name: 'loading' })
    await flush()
    IO.last.cb([{ isIntersecting: true }])
    await flush()
    expect(wrapper.find('[data-lottie-stage]').classes()).toContain('hidden')
  })
})

describe('StatusView pictures', () => {
  it.each([
    ['period-empty', 'Tidak ada data untuk periode ini', 'state-periode-kosong'],
    ['empty', 'Belum ada data', 'state-kosong'],
    ['error', 'Data gagal dimuat', 'state-galat'],
  ] as const)('%s: the picture is there in the compact variant too (96 px)', async (kind, title, art) => {
    media(false)
    const { wrapper } = await mountApp(StatusView, { kind, compact: true })
    await flush()
    expect(wrapper.text()).toContain(title)
    expect(wrapper.find('.pico-ill img').attributes('src')).toBe(`/illustrations/light/${art}.svg`)
    expect(wrapper.find('.pico-ill').attributes('style')).toContain('96px')
  })
  it('loading shows the loading poster (the Lottie plays only in view)', async () => {
    media(false)
    vi.stubGlobal('IntersectionObserver', IO)
    const { wrapper } = await mountApp(StatusView, { kind: 'loading' })
    await flush()
    await until(() => wrapper.find('[data-lottie] img').exists()) // the wrapper is its own chunk
    expect(wrapper.find('[data-lottie] img').attributes('src')).toBe('/lottie/posters/loading.svg')
  })
})
