import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createCache } from './cache'
import { ApiException } from './errors'
import { createUseResource } from './resource'

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve()
  await nextTick()
}
const deferred = <T>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}

function host<T>(setup: () => T) {
  let out!: T
  const wrapper = mount(
    defineComponent({
      setup() {
        out = setup()
        return () => h('div')
      },
    }),
  )
  return { out, wrapper }
}

describe('useResource', () => {
  it('loads, goes idle -> loading -> success', async () => {
    const useResource = createUseResource(createCache())
    const d = deferred<number>()
    const { out } = host(() => useResource('k', () => d.promise))
    expect(out.status.value).toBe('loading')
    expect(out.data.value).toBeUndefined()
    d.resolve(1)
    await flush()
    expect(out.status.value).toBe('success')
    expect(out.data.value).toBe(1)
    expect(out.error.value).toBeNull()
  })

  it('two components that mount the same resource cause one request', async () => {
    const useResource = createUseResource(createCache())
    const loader = vi.fn(async () => 5)
    const a = host(() => useResource('national', loader))
    const b = host(() => useResource('national', loader))
    await flush()
    expect(loader).toHaveBeenCalledTimes(1)
    expect(a.out.data.value).toBe(5)
    expect(b.out.data.value).toBe(5)
  })

  it('a seeded value is on the first render with no request', () => {
    const cache = createCache()
    cache.seed({ k: 'seeded' })
    const useResource = createUseResource(cache)
    const loader = vi.fn(async () => 'fresh')
    const { out } = host(() => useResource('k', loader))
    expect(out.data.value).toBe('seeded')
    expect(out.status.value).toBe('success')
    expect(loader).not.toHaveBeenCalled()
  })

  it('an area switch aborts the earlier request and the late response never reaches data', async () => {
    const useResource = createUseResource(createCache())
    const area = ref('aceh')
    const pending: Record<string, ReturnType<typeof deferred<string>>> = { aceh: deferred(), bali: deferred() }
    const signals: Record<string, AbortSignal> = {}
    const { out } = host(() =>
      useResource(
        () => area.value,
        (signal) => ((signals[area.value] = signal), pending[area.value]!.promise),
      ),
    )
    await flush()
    area.value = 'bali'
    await flush()
    expect(signals.aceh?.aborted).toBe(true)
    pending.bali!.resolve('BALI')
    await flush()
    pending.aceh!.resolve('ACEH') // late
    await flush()
    expect(out.data.value).toBe('BALI')
    expect(out.status.value).toBe('success')
  })

  it('an error gives the typed error, and refresh() retries', async () => {
    const useResource = createUseResource(createCache())
    const loader = vi.fn().mockRejectedValueOnce(new ApiException('http', 500)).mockResolvedValueOnce(2)
    const { out } = host(() => useResource('k', loader))
    await flush()
    expect(out.status.value).toBe('error')
    expect(out.error.value).toMatchObject({ kind: 'http', status: 500 })
    await out.refresh()
    expect(out.status.value).toBe('success')
    expect(out.data.value).toBe(2)
    expect(out.error.value).toBeNull()
  })

  it('a refetch error keeps the old data on screen', async () => {
    const useResource = createUseResource(createCache())
    const loader = vi.fn().mockResolvedValueOnce('old').mockRejectedValueOnce(new ApiException('network'))
    const { out } = host(() => useResource('k', loader))
    await flush()
    await out.refresh()
    expect(out.data.value).toBe('old')
    expect(out.status.value).toBe('error')
    expect(out.error.value).toMatchObject({ kind: 'network' })
  })

  it('a non-API exception from a loader maps to kind shape', async () => {
    const useResource = createUseResource(createCache())
    const { out } = host(() => useResource('k', async () => { throw new TypeError('normaliser bug') }))
    await flush()
    expect(out.error.value).toMatchObject({ kind: 'shape' })
  })

  it('a null key stays idle and requests nothing', async () => {
    const useResource = createUseResource(createCache())
    const loader = vi.fn(async () => 1)
    const { out } = host(() => useResource(() => null, loader))
    await flush()
    expect(out.status.value).toBe('idle')
    expect(loader).not.toHaveBeenCalled()
  })

  it('unmount aborts the request', async () => {
    const useResource = createUseResource(createCache())
    let sig!: AbortSignal
    const { wrapper } = host(() => useResource('k', (s) => ((sig = s), new Promise<never>(() => {}))))
    await flush()
    wrapper.unmount()
    expect(sig.aborted).toBe(true)
  })

  it('live mode: a stale value refetches in the background at mount and stays visible meanwhile', async () => {
    const cache = createCache({ live: true, now: () => 0 })
    cache.seed({ k: 'build-time' })
    const d = deferred<string>()
    const useResource = createUseResource(cache)
    const { out } = host(() => useResource('k', () => d.promise))
    await flush()
    expect(out.data.value).toBe('build-time')
    expect(out.status.value).toBe('success')
    d.resolve('fresh')
    await flush()
    expect(out.data.value).toBe('fresh')
  })
})
