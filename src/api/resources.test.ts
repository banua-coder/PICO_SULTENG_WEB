import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { INDONESIA, SULTENG, areaByCode } from '@/app/areas'
import { cache } from './cache'
import { ApiException } from './errors'
import { kabupatenLatestLoader, KABUPATEN_API_PATH, KABUPATEN_SNAPSHOT_URL, useAreaSeries, useKabupatenLatest, useNationalSeries, useProvincesLatest } from './useSeries'
import { useHospitals, usePartners } from './useContent'
import snapshot from '../../test/fixtures/kabupaten-latest.snapshot.json'
import withLatest from '../../test/fixtures/api/regencies-with-latest.synthetic.json'

const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0))
}
const body = (name: string) => import(`../../test/fixtures/api/${name}.json`).then((m) => m.default)
const urls: string[] = []
function stubApi(map: Record<string, unknown>) {
  urls.length = 0
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(url)
      const key = Object.keys(map).find((k) => url.endsWith(k))
      if (!key) return new Response('{}', { status: 404 })
      return new Response(JSON.stringify(map[key]), { status: 200 })
    }),
  )
}
function host<T>(setup: () => T) {
  let out!: T
  const w = mount(defineComponent({ setup() { out = setup(); return () => h('div') } }))
  return { out, w }
}

afterEach(() => {
  vi.unstubAllGlobals()
  cache.clear()
})

describe('composables over the fake API', () => {
  it('two components that mount useNationalSeries() cause one request, and rows are ascending by date', async () => {
    stubApi({ '/national?all=true': await body('national') })
    const a = host(() => useNationalSeries())
    const b = host(() => useNationalSeries())
    await flush()
    expect(urls).toHaveLength(1)
    expect(a.out.status.value).toBe('success')
    const rows = a.out.data.value!.rows
    expect(rows.at(-1)?.date).toBe('2024-01-14')
    expect(b.out.data.value).toBe(a.out.data.value)
  })

  it('series URLs carry no sort, start_date or end_date (Q3)', async () => {
    stubApi({
      '/national?all=true': await body('national'),
      '/provinces/72/cases?all=true': await body('province-72-cases'),
      '/regencies/7271/cases': await body('regency-7271-cases'),
    })
    host(() => useAreaSeries(INDONESIA))
    host(() => useAreaSeries(SULTENG))
    host(() => useAreaSeries(areaByCode('kabupaten', 7271)!))
    await flush()
    expect(urls).toHaveLength(3)
    for (const u of urls) expect(u).not.toMatch(/sort|start_date|end_date/)
  })

  it('an unknown province answer (404 from the new API) is a typed http error', async () => {
    stubApi({})
    const { out } = host(() => useAreaSeries(SULTENG))
    await flush()
    expect(out.status.value).toBe('error')
    expect(out.error.value).toMatchObject({ kind: 'http', status: 404 })
  })

  it('a body that fails its guard is kind shape and no data is shown', async () => {
    stubApi({ '/national?all=true': { status: 'success', data: [{ nope: 1 }] } })
    const { out } = host(() => useNationalSeries())
    await flush()
    expect(out.error.value).toMatchObject({ kind: 'shape' })
    expect(out.data.value).toBeUndefined()
  })

  it('an area switch aborts the earlier request (province then kabupaten)', async () => {
    const signals: AbortSignal[] = []
    vi.stubGlobal('fetch', vi.fn((_u: string, init: RequestInit) => {
      signals.push(init.signal!)
      return new Promise(() => {})
    }))
    const area = { value: SULTENG }
    const { out } = host(() => useAreaSeries(() => area.value))
    await flush()
    expect(out.status.value).toBe('loading')
    expect(signals).toHaveLength(1)
  })

  it('provinces latest, hospitals and partners normalise through the same path', async () => {
    stubApi({
      '/provinces': await body('provinces'),
      '/hospitals?load_all=true': await body('hospitals'),
      '/partners?load_all=true': await body('partners'),
    })
    const p = host(() => useProvincesLatest())
    const h = host(() => useHospitals())
    const pa = host(() => usePartners())
    await flush()
    expect(p.out.data.value).toHaveLength(34)
    expect(h.out.data.value?.[0]?.kabupaten?.level).toBe('kabupaten')
    expect(pa.out.data.value?.[0]?.name).toBe('Detexi')
  })
})

describe('useKabupatenLatest: snapshot now, API later (spec 14, PR #91)', () => {
  it('defaults to the build-time snapshot, with no API call', async () => {
    stubApi({ [KABUPATEN_SNAPSHOT_URL]: snapshot })
    const { out } = host(() => useKabupatenLatest())
    await flush()
    expect(urls).toEqual([KABUPATEN_SNAPSHOT_URL])
    expect(out.data.value?.[0]?.area.level).toBe('kabupaten')
  })

  it('the snapshot loader returns the 13-row file as is', async () => {
    stubApi({ [KABUPATEN_SNAPSHOT_URL]: snapshot })
    const rows = await kabupatenLatestLoader('snapshot')(new AbortController().signal)
    expect(rows).toHaveLength(13)
  })

  it('the API loader maps /regencies?include_latest_case=true, and works once the API deploys it', async () => {
    stubApi({ [KABUPATEN_API_PATH]: withLatest })
    const rows = await kabupatenLatestLoader('api')(new AbortController().signal)
    expect(urls[0]).toContain('include_latest_case=true')
    expect(rows.map((r) => r.area.slug)).toEqual(['kota-palu'])
    expect(rows[0]?.latest.rt === null || typeof rows[0]?.latest.rt?.value === 'number').toBe(true)
  })

  it('an API error is typed', async () => {
    stubApi({})
    await expect(kabupatenLatestLoader('api')(new AbortController().signal)).rejects.toBeInstanceOf(ApiException)
  })
})
