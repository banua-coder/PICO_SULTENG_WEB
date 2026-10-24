import { afterEach, describe, expect, it } from 'vitest'
import { cache } from '@/api/cache'
import { infographics } from '@/api/normalize/content'
import { ENDPOINTS } from '@/api/endpoints'
import type { Infographic } from '@/api/types'
import { fx, type WireInfographic } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import InfografisView from './InfografisView.vue'
import { filterInfographics, PAGE, parseId } from './useInfografisPage'

afterEach(() => cache.clear())
// happy-dom reports every <img> as loaded-with-no-size, which PicoImage reads as a failed load
Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => false, configurable: true })
const isOpen = (w: { element: Element }) => (w.element as HTMLDialogElement).open
const many = (n: number): Infographic[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, title: `Judul ${i + 1}`, source: null, images: [`https://img.test/${i + 1}.jpg`] }))
const seed = (list: Infographic[]) => cache.seed({ [ENDPOINTS.infographics.path]: list })

describe('logic', () => {
  it('sorts newest first and filters by title, ignoring case', () => {
    const l = many(5)
    expect(filterInfographics(l, '').map((i) => i.id)).toEqual([5, 4, 3, 2, 1])
    expect(filterInfographics(l, ' JUDUL 3 ').map((i) => i.id)).toEqual([3])
    expect(filterInfographics(l, 'zzz')).toEqual([])
  })
  it('reads ?id only as a positive integer', () => {
    expect([parseId('145'), parseId('0'), parseId('-1'), parseId('1e3'), parseId(['7']), parseId(undefined), parseId('')]).toEqual([145, null, null, null, 7, null, null])
  })
})

describe('InfografisView', () => {
  it('renders 24 cards first, 24 more on "Muat lagi", and the count', async () => {
    seed(many(60))
    const { wrapper } = await mountApp(InfografisView, {}, '/infografis')
    await flush()
    expect(wrapper.findAll('ul > li')).toHaveLength(PAGE)
    expect(wrapper.findAll('img')).toHaveLength(PAGE)
    expect(wrapper.text()).toContain('Menampilkan 24 dari 60 infografis')
    await wrapper.findAll('button').find((b) => b.text() === 'Muat lagi')!.trigger('click')
    expect(wrapper.findAll('ul > li')).toHaveLength(48)
    expect(wrapper.find('li button').text()).toContain('Judul 60') // newest first
  })

  it('search narrows the cards and says when nothing matches', async () => {
    seed(many(30))
    const { wrapper } = await mountApp(InfografisView, {}, '/infografis')
    await flush()
    await wrapper.find('input[type="search"]').setValue('judul 7')
    expect(wrapper.findAll('ul > li')).toHaveLength(1)
    await wrapper.find('input[type="search"]').setValue('tidak ada')
    expect(wrapper.text()).toContain('Tidak ada infografis dengan judul itu')
  })

  it('opens the viewer from ?id, with the position and the source link; closing removes the id', async () => {
    const list = infographics(fx<WireInfographic[]>('infographics'))
    seed(list)
    const id = list[1]!.id
    const { wrapper, router } = await mountApp(InfografisView, {}, `/infografis?id=${id}`)
    await flush()
    const dlg = wrapper.find('dialog')
    expect(isOpen(dlg)).toBe(true)
    expect(dlg.find('h2').text()).toBe(list[1]!.title)
    expect(dlg.text()).toContain(`1 dari ${list[1]!.images.length}`)
    expect(dlg.find('img').attributes('alt')).toBe(`${list[1]!.title}, gambar 1 dari ${list[1]!.images.length}`)
    await dlg.trigger('keydown', { key: 'ArrowRight' })
    expect(dlg.text()).toContain(`2 dari ${list[1]!.images.length}`)
    await dlg.findAll('button').find((b) => b.text() === 'Tutup')!.trigger('click')
    await flush()
    expect(router.currentRoute.value.query.id).toBeUndefined()
    expect(isOpen(wrapper.find('dialog'))).toBe(false)
  })

  it('an unknown ?id opens nothing; an item with no images says so', async () => {
    seed([{ id: 1, title: 'Tanpa gambar', source: 'https://www.instagram.com/p/x/', images: [] }])
    const a = await mountApp(InfografisView, {}, '/infografis?id=99')
    await flush()
    expect(isOpen(a.wrapper.find('dialog'))).toBe(false)
    const b = await mountApp(InfografisView, {}, '/infografis?id=1')
    await flush()
    expect(b.wrapper.text()).toContain('tidak punya gambar yang dapat dimuat')
    expect(b.wrapper.find('dialog a').attributes('href')).toBe('https://www.instagram.com/p/x/')
  })
})
