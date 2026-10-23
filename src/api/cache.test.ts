import { describe, expect, it, vi } from 'vitest'
import { createCache } from './cache'

const deferred = <T>() => {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
  return { promise, resolve, reject }
}
const never = (signal: AbortSignal) => new Promise<never>((_r, rej) => signal.addEventListener('abort', () => rej(signal.reason)))
const settle = async (p: Promise<unknown>) => p.then(() => 'ok', (e: unknown) => (e as Error).name)

describe('cache: dedupe', () => {
  it('two callers for one key share one request and one value', async () => {
    const c = createCache()
    const d = deferred<number>()
    const loader = vi.fn(() => d.promise)
    const a = c.fetch('k', loader)
    const b = c.fetch('k', loader)
    d.resolve(7)
    expect(await a).toBe(7)
    expect(await b).toBe(7)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('a later call after resolve uses the cached value (archive mode never goes stale)', async () => {
    let t = 0
    const c = createCache({ now: () => t })
    const loader = vi.fn(async () => 1)
    await c.fetch('k', loader)
    t = 10 * 365 * 24 * 3600_000
    await c.fetch('k', loader)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(c.isStale('k')).toBe(false)
  })

  it('a failed request is not cached, the next call retries', async () => {
    const c = createCache()
    const loader = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(5)
    await expect(c.fetch('k', loader)).rejects.toThrow('boom')
    expect(await c.fetch('k', loader)).toBe(5)
    expect(c.peek('k')).toBe(5)
  })

  it('force refetches even when fresh and keeps the old value until the new one lands', async () => {
    const c = createCache()
    await c.fetch('k', async () => 1)
    const d = deferred<number>()
    const p = c.fetch('k', () => d.promise, { force: true })
    expect(c.peek('k')).toBe(1)
    d.resolve(2)
    expect(await p).toBe(2)
    expect(c.peek('k')).toBe(2)
  })
})

describe('cache: stale rule', () => {
  it('live mode: a value older than 15 minutes is stale and fetch refetches', async () => {
    let t = 0
    const c = createCache({ live: true, now: () => t })
    const loader = vi.fn(async () => t)
    await c.fetch('k', loader)
    t = 14 * 60_000
    expect(c.isStale('k')).toBe(false)
    t = 15 * 60_000 + 1
    expect(c.isStale('k')).toBe(true)
    expect(c.peek('k')).toBe(0) // old value stays visible
    expect(await c.fetch('k', loader)).toBe(t)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('a missing key counts as stale', () => {
    expect(createCache().isStale('nope')).toBe(true)
  })
})

describe('cache: abort', () => {
  it('an aborted caller rejects with AbortError and the sole request is aborted', async () => {
    const c = createCache()
    const seen: AbortSignal[] = []
    const ctl = new AbortController()
    const p = settle(c.fetch('k', (s) => (seen.push(s), never(s)), { signal: ctl.signal }))
    ctl.abort()
    expect(await p).toBe('AbortError')
    expect(seen[0]?.aborted).toBe(true)
  })

  it('aborting one of two callers keeps the shared request alive for the other', async () => {
    const c = createCache()
    const d = deferred<number>()
    const seen: AbortSignal[] = []
    const loader = (s: AbortSignal) => (seen.push(s), d.promise)
    const c1 = new AbortController()
    const p1 = settle(c.fetch('k', loader, { signal: c1.signal }))
    const p2 = c.fetch('k', loader)
    c1.abort()
    expect(await p1).toBe('AbortError')
    expect(seen[0]?.aborted).toBe(false)
    d.resolve(9)
    expect(await p2).toBe(9)
    expect(c.peek('k')).toBe(9)
  })

  it('after every caller aborts, a new call starts a fresh request', async () => {
    const c = createCache()
    const ctl = new AbortController()
    const first = settle(c.fetch('k', never, { signal: ctl.signal }))
    ctl.abort()
    await first
    expect(await c.fetch('k', async () => 3)).toBe(3)
  })

  it('an already aborted signal rejects at once and starts no request', async () => {
    const c = createCache()
    const loader = vi.fn(async () => 1)
    const ctl = new AbortController()
    ctl.abort()
    expect(await settle(c.fetch('k', loader, { signal: ctl.signal }))).toBe('AbortError')
    expect(loader).not.toHaveBeenCalled()
  })

  it('a late response for an aborted request never lands in the cache', async () => {
    const c = createCache()
    const d = deferred<number>()
    const ctl = new AbortController()
    const p = settle(c.fetch('k', () => d.promise, { signal: ctl.signal }))
    ctl.abort()
    await p
    d.resolve(99) // loader ignores the abort and resolves late
    await d.promise
    await Promise.resolve()
    expect(c.peek('k')).toBeUndefined()
    // and a later request for the same key is not poisoned by it
    expect(await c.fetch('k', async () => 1)).toBe(1)
  })
})

describe('cache: LRU for series', () => {
  it('keeps at most 8 series and evicts the least recently used', async () => {
    const c = createCache()
    for (let i = 0; i < 8; i++) await c.fetch(`s${i}`, async () => i, { series: true })
    await c.fetch('s0', async () => -1, { series: true }) // touch s0 (cached, no load)
    await c.fetch('s8', async () => 8, { series: true })
    expect(c.peek('s1')).toBeUndefined() // oldest untouched was evicted
    expect(c.peek('s0')).toBe(0)
    expect(c.peek('s8')).toBe(8)
  })

  it('small resources are never capped', async () => {
    const c = createCache()
    for (let i = 0; i < 30; i++) await c.fetch(`r${i}`, async () => i)
    expect(c.peek('r0')).toBe(0)
  })

  it('never evicts a series that still has a request in flight', async () => {
    const c = createCache({ seriesLimit: 1 })
    const d = deferred<number>()
    const inflight = c.fetch('a', () => d.promise, { series: true })
    await c.fetch('b', async () => 2, { series: true })
    d.resolve(1)
    expect(await inflight).toBe(1)
  })
})

describe('cache: SSG seed', () => {
  it('seeded values are served without a request', async () => {
    const c = createCache()
    c.seed({ k: { n: 1 } })
    const loader = vi.fn(async () => ({ n: 2 }))
    expect(c.peek('k')).toEqual({ n: 1 })
    expect(await c.fetch('k', loader)).toEqual({ n: 1 })
    expect(loader).not.toHaveBeenCalled()
  })

  it('in live mode seeded values are stale at once, so mount refetches in the background', () => {
    const c = createCache({ live: true, now: () => 1e12 })
    c.seed({ k: 1 })
    expect(c.peek('k')).toBe(1)
    expect(c.isStale('k')).toBe(true)
  })

  it('exportSmall returns resolved non-series values only, as plain JSON', async () => {
    const c = createCache()
    await c.fetch('small', async () => ({ a: 1 }))
    await c.fetch('series', async () => [1, 2, 3], { series: true })
    expect(c.exportSmall()).toEqual({ small: { a: 1 } })
  })
})
