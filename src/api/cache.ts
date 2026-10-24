import { isLiveMode, LIVE_STALE_MS } from './config'

export type CacheOptions = {
  /** Live mode: a value older than 15 minutes is stale. Archive mode (default): never stale. */
  live?: boolean
  now?: () => number
  /** Max resolved series kept. Small resources are never capped. */
  seriesLimit?: number
}

export type FetchOptions = {
  /** Caller abort. Aborts the shared request only when every caller has aborted. */
  signal?: AbortSignal
  /** Counts toward the LRU cap and is left out of the SSG initial state. */
  series?: boolean
  /** Refetch even if the cached value is fresh. */
  force?: boolean
}

type Inflight = { ctl: AbortController; promise: Promise<unknown> }
type Entry = { has: boolean; value?: unknown; at: number; series: boolean; inflight?: Inflight }

const abortError = () => new DOMException('The request was aborted', 'AbortError')

/**
 * Module-level request cache (ADR-0101): dedupes in-flight requests by key, keeps the value,
 * applies the per-mode stale rule, caps series with an LRU, and seeds from SSG initial state.
 */
export function createCache({ live = false, now = Date.now, seriesLimit = 8 }: CacheOptions = {}) {
  const entries = new Map<string, Entry>()
  /** Callers waiting on each shared request. The request aborts when this reaches 0. */
  const subs = new WeakMap<Inflight, number>()

  const touch = (key: string, e: Entry) => {
    entries.delete(key)
    entries.set(key, e)
  }

  const evict = () => {
    let resolvedSeries = [...entries].filter(([, e]) => e.series && e.has && !e.inflight)
    for (const [key] of resolvedSeries) {
      if (resolvedSeries.length <= seriesLimit) break
      entries.delete(key)
      resolvedSeries = resolvedSeries.slice(1)
    }
  }

  const isStale = (key: string): boolean => {
    const e = entries.get(key)
    if (!e?.has) return true
    return live && now() - e.at > LIVE_STALE_MS
  }

  const peek = <T>(key: string): T | undefined => {
    const e = entries.get(key)
    if (!e?.has) return undefined
    touch(key, e)
    return e.value as T
  }

  function fetch<T>(key: string, loader: (signal: AbortSignal) => Promise<T>, opts: FetchOptions = {}): Promise<T> {
    const { signal, series = false, force = false } = opts
    if (signal?.aborted) return Promise.reject(abortError())

    let e = entries.get(key)
    if (e?.has && !force && !isStale(key)) {
      touch(key, e)
      return Promise.resolve(e.value as T)
    }
    if (!e) {
      e = { has: false, at: 0, series }
      entries.set(key, e)
    }
    const entry = e

    if (!entry.inflight) {
      const ctl = new AbortController()
      const inflight: Inflight = { ctl, promise: Promise.resolve() }
      inflight.promise = loader(ctl.signal).then(
        (value) => {
          // an aborted or replaced request must not land in the cache
          if (entry.inflight === inflight && !ctl.signal.aborted) {
            entry.value = value
            entry.has = true
            entry.at = now()
            entry.inflight = undefined
            touch(key, entry)
            evict()
          }
          return value
        },
        (err: unknown) => {
          if (entry.inflight === inflight) {
            entry.inflight = undefined
            if (!entry.has && entries.get(key) === entry) entries.delete(key)
          }
          throw err
        },
      )
      inflight.promise.catch(() => {}) // callers handle it through their own promise
      entry.inflight = inflight
      subs.set(inflight, 0)
    }

    const inflight = entry.inflight
    subs.set(inflight, (subs.get(inflight) ?? 0) + 1)
    return new Promise<T>((resolve, reject) => {
      let done = false
      const onAbort = () => {
        if (done) return
        done = true
        const left = (subs.get(inflight) ?? 1) - 1
        subs.set(inflight, left)
        if (left === 0 && entry.inflight === inflight) {
          inflight.ctl.abort()
          entry.inflight = undefined
          if (!entry.has && entries.get(key) === entry) entries.delete(key)
        }
        reject(abortError())
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      inflight.promise.then(
        (v) => {
          if (done) return
          done = true
          signal?.removeEventListener('abort', onAbort)
          resolve(v as T)
        },
        (err: unknown) => {
          if (done) return
          done = true
          signal?.removeEventListener('abort', onAbort)
          reject(err)
        },
      )
    })
  }
  /** Load SSG initial state. In live mode these values are stale at once, so mount refetches. */
  const seed = (values: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(values)) {
      entries.set(key, { has: true, value, at: live ? -Infinity : now(), series: false })
    }
  }

  /** Resolved small resources, for vite-ssg initialState. Series are never included. */
  const exportSmall = (): Record<string, unknown> =>
    Object.fromEntries([...entries].filter(([, e]) => e.has && !e.series).map(([k, e]) => [k, e.value]))

  const clear = () => entries.clear()

  return { fetch, peek, isStale, seed, exportSmall, clear }
}

export type Cache = ReturnType<typeof createCache>

/** The app-wide cache. */
export const cache: Cache = createCache({ live: isLiveMode() })
