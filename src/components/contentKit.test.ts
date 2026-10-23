import { afterEach, describe, expect, it, vi } from 'vitest'
import { flush, mountApp } from '../../test/support/mount'
import ArchiveNotice from './ArchiveNotice.vue'
import CopyButton from './CopyButton.vue'
import PicoImage from './PicoImage.vue'
import ReviewTodo from './ReviewTodo.vue'
import TableOfContents from './TableOfContents.vue'

// happy-dom reports every image as complete with width 0; real browsers say complete=false while loading
Object.defineProperty(HTMLImageElement.prototype, 'complete', { get: () => false, configurable: true })

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('ReviewTodo', () => {
  it('is a visible marker with a data-todo id that check:dist looks for', async () => {
    const { wrapper } = await mountApp(ReviewTodo, { id: 'wiki-terms', note: 'owner review of the terms' })
    expect(wrapper.attributes('data-todo')).toBe('wiki-terms')
    expect(wrapper.text()).toBe('TODO: owner review of the terms')
  })
})

describe('TableOfContents', () => {
  it('is a named nav with an anchor per section', async () => {
    const { wrapper } = await mountApp(TableOfContents, { items: [{ id: 'a', label: 'Satu' }, { id: 'b', label: 'Dua' }] })
    expect(wrapper.find('nav').attributes('aria-label')).toBe('Daftar isi halaman')
    expect(wrapper.findAll('a').map((a) => a.attributes('href'))).toEqual(['#a', '#b'])
  })
})

describe('ArchiveNotice', () => {
  it('is a note landmark with its text, not an alert', async () => {
    const { wrapper } = await mountApp(ArchiveNotice, {}, '/', { default: '<p>Arsip pandemi</p>' })
    expect(wrapper.find('aside').attributes('role')).toBe('note')
    expect(wrapper.text()).toContain('Arsip pandemi')
    expect(wrapper.html()).not.toContain('crimson')
  })
})

describe('CopyButton doneText', () => {
  it('announces the given text', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    const { wrapper } = await mountApp(CopyButton, { value: '123', label: 'nomor rekening', doneText: 'Nomor rekening disalin' })
    await wrapper.find('button').trigger('click')
    await flush()
    expect(wrapper.find('[role="status"]').text()).toBe('Nomor rekening disalin')
  })
})

describe('PicoImage retryable', () => {
  it('after a failed load it says so and a retry button tries the image again, all inside the same box', async () => {
    const { wrapper } = await mountApp(PicoImage, { src: 'https://i.ibb.co/x.jpg', alt: 'Infografis', ratio: '4/5', retryable: true })
    const box = wrapper.find('div').attributes('style')
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('[data-failed]').text()).toContain('Gambar tidak dapat dimuat')
    expect(wrapper.find('div').attributes('style')).toBe(box)
    await wrapper.find('[data-failed] button').trigger('click')
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('[data-failed]').exists()).toBe(false)
  })
  it('not retryable by default: just the placeholder', async () => {
    const { wrapper } = await mountApp(PicoImage, { src: 'https://i.ibb.co/x.jpg', alt: 'x', ratio: '1/1' })
    await wrapper.find('img').trigger('error')
    expect(wrapper.find('[data-failed]').exists()).toBe(false)
  })
})

describe('inlineSvg', () => {
  const raw = '<svg xmlns="x" viewBox="0 0 320 240" width="320" height="240" role="img" aria-labelledby="t d"><title id="t">A</title><desc id="d">B</desc><defs><clipPath id="th"><circle/></clipPath></defs><g clip-path="url(#th)"/></svg>'
  it('is decorative, unique per use, and keeps the viewBox', async () => {
    const { inlineSvg } = await import('./inlineSvg')
    const out = inlineSvg(raw, 'u1')
    expect(out).toContain('aria-hidden="true"')
    expect(out).not.toMatch(/<title|<desc|role=|aria-labelledby|width="320"/)
    expect(out).toContain('viewBox="0 0 320 240"')
    expect(out).toContain('id="u1-th"')
    expect(out).toContain('url(#u1-th)')
    expect(inlineSvg(raw, 'u2')).toContain('url(#u2-th)')
  })
})
