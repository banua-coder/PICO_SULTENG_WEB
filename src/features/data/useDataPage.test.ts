import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mount } from '@vue/test-utils'
import { createHead } from '@unhead/vue/client'
import { installI18n } from '@/app/i18n'
import { createApp } from 'vue'
import { INDONESIA, SULTENG } from '@/app/areas'
import { buildRoutes } from '@/app/routeTable'
import { flush } from '../../../test/support/mount'
import { areaPath, parseIso, parseView, resolveWindow, useDataPage } from './useDataPage'
import type { DataPageState } from './useDataPage'

afterEach(() => vi.unstubAllGlobals())

const B = { from: '2020-03-02', to: '2024-01-14' }

describe('parseIso', () => {
  it.each([['2021-07-01', '2021-07-01'], ['abc', undefined], ['2021-02-30', undefined], ['2021-7-1', undefined], ['', undefined], [undefined, undefined], [['2021-07-01', '2022-01-01'], '2021-07-01']])('%j -> %j', (v, want) => expect(parseIso(v)).toBe(want))
})

describe('resolveWindow (spec 41)', () => {
  it('no query is the whole series', () => expect(resolveWindow({}, B)).toEqual(B))
  it('?dari=1999-01-01 clamps to 2020-03-02 without an error', () => expect(resolveWindow({ dari: '1999-01-01' }, B)).toEqual(B))
  it('?dari=abc falls back to the default', () => expect(resolveWindow({ dari: 'abc' }, B)).toEqual(B))
  it('?sampai after the end clamps to the last day', () => expect(resolveWindow({ sampai: '2030-01-01' }, B).to).toBe('2024-01-14'))
  it('a window inside the range is kept', () => expect(resolveWindow({ dari: '2021-07-01', sampai: '2021-07-31' }, B)).toEqual({ from: '2021-07-01', to: '2021-07-31' }))
  it('a start after the end is pulled to the end', () => expect(resolveWindow({ dari: '2022-01-01', sampai: '2021-01-01' }, B)).toEqual({ from: '2021-01-01', to: '2021-01-01' }))
  it('bounds narrower than the record (a kabupaten series) clamp too', () => expect(resolveWindow({ dari: '2020-03-02' }, { from: '2020-03-07', to: '2024-01-14' }).from).toBe('2020-03-07'))
})

describe('parseView and areaPath', () => {
  it('tampilan defaults to harian', () => {
    expect(parseView('kumulatif')).toBe('kumulatif')
    expect(parseView('x')).toBe('harian')
    expect(parseView(undefined)).toBe('harian')
  })
  it('area routes follow C5', () => {
    expect(areaPath(INDONESIA)).toBe('/data/indonesia')
    expect(areaPath(SULTENG)).toBe('/data/provinsi/sulawesi-tengah')
  })
})

async function page(path: string) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 404 })))
  const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
  const probe = createApp({ render: () => null })
  const i18n = installI18n(probe, router)
  await router.push(path)
  await router.isReady()
  let state!: DataPageState
  mount(defineComponent({ setup() { state = useDataPage(SULTENG); return () => h('div') } }), { global: { plugins: [router, i18n, createHead()] } })
  await flush()
  return { state, router }
}

describe('useDataPage', () => {
  it('reads window and view from the query', async () => {
    const { state } = await page('/data/provinsi/sulawesi-tengah?dari=2021-07-01&sampai=2021-07-31&tampilan=kumulatif')
    expect(state.window.value).toEqual({ from: '2021-07-01', to: '2021-07-31' })
    expect(state.view.value).toBe('kumulatif')
    expect(state.customEnd.value).toBe(true)
  })
  it('the default window is the record and is not a custom end', async () => {
    const { state } = await page('/data/provinsi/sulawesi-tengah')
    expect(state.window.value).toEqual(B)
    expect(state.customEnd.value).toBe(false)
  })
  it('setWindow writes with replace, omits defaults and keeps other query keys; three changes add no history entries', async () => {
    const { state, router } = await page('/data/provinsi/sulawesi-tengah?tampilan=kumulatif')
    const before = history.length
    state.setWindow({ from: '2021-01-01', to: '2021-12-31' })
    await flush()
    expect(router.currentRoute.value.query).toEqual({ tampilan: 'kumulatif', dari: '2021-01-01', sampai: '2021-12-31' })
    state.setWindow({ from: '2022-01-01', to: '2022-12-31' })
    state.setWindow({ from: '2020-03-02', to: '2024-01-14' }) // back to the whole record: defaults leave the URL
    await flush()
    expect(router.currentRoute.value.query).toEqual({ tampilan: 'kumulatif' })
    expect(history.length).toBe(before)
    router.back()
    await nextTick()
    expect(router.currentRoute.value.path).toBe('/data/provinsi/sulawesi-tengah') // replace, not push: nothing to go back to inside the page
  })
  it('setView leaves harian out of the URL', async () => {
    const { state, router } = await page('/data/provinsi/sulawesi-tengah')
    state.setView('kumulatif')
    await flush()
    expect(router.currentRoute.value.query.tampilan).toBe('kumulatif')
    state.setView('harian')
    await flush()
    expect(router.currentRoute.value.query.tampilan).toBeUndefined()
  })
})
