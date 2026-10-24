import { getCurrentInstance, getCurrentScope, inject, onScopeDispose, onServerPrefetch, readonly, shallowRef, toValue, watch } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { cache as defaultCache } from './cache'
import type { Cache } from './cache'
import { ApiException, isAbort } from './errors'
import { SSR_ERRORS_KEY, SSR_KEYS } from './ssrState'
import type { ApiError, Resource, ResourceStatus } from './types'

export type ResourceOptions = {
  /** Counts toward the series LRU cap and stays out of the SSG initial state. */
  series?: boolean
  /** A big list (infographics): never prerendered or embedded in a page, loaded by the client after hydration. Same rule as a series. */
  large?: boolean
}

const toApiError = (e: unknown): ApiError =>
  e instanceof ApiException ? { kind: e.kind, ...(e.status !== undefined && { status: e.status }) } : { kind: 'shape' }

/**
 * Builds the `useResource` that every `useX()` of C2 is made of.
 * Key = the URL (or any string) the cache dedupes on. A `null` key means "nothing to load yet".
 */
export function createUseResource(cache: Cache) {
  return function useResource<T>(
    key: MaybeRefOrGetter<string | null>,
    loader: (signal: AbortSignal) => Promise<T>,
    opts: ResourceOptions = {},
  ): Resource<T> {
    const data = shallowRef<T | undefined>()
    const error = shallowRef<ApiError | null>(null)
    const status = shallowRef<ResourceStatus>('idle')
    let ctl: AbortController | undefined
    const ssrKeys = getCurrentInstance() ? inject(SSR_KEYS, null) : null

    async function load(k: string, force = false) {
      ctl?.abort()
      const mine = (ctl = new AbortController())
      const hadData = data.value !== undefined
      if (!hadData) status.value = 'loading'
      // Prerender: a series is never fetched or embedded (0.4 to 0.9 MB each). The client starts in the same loading state.
      if (import.meta.env.SSR && (opts.series || opts.large)) return
      try {
        const value = await cache.fetch<T>(k, loader, { signal: mine.signal, series: opts.series ?? false, force })
        if (mine.signal.aborted) return
        data.value = value
        error.value = null
        status.value = 'success'
      } catch (e) {
        if (mine.signal.aborted || isAbort(e)) return // superseded: a late result must not land
        error.value = toApiError(e)
        if (import.meta.env.SSR) {
          const g = globalThis as unknown as Record<string, string[]>
          ;(g[SSR_ERRORS_KEY] ??= []).push(`${k}: ${(e as Error).message}`)
        }
        status.value = 'error' // old data, if any, stays in `data`
      }
    }

    function start(k: string | null) {
      if (k === null) {
        ctl?.abort()
        data.value = undefined
        error.value = null
        status.value = 'idle'
        return Promise.resolve()
      }
      if (ssrKeys && !opts.series && !opts.large) ssrKeys.add(k)
      const cached = cache.peek<T>(k)
      // show the cached value (seeded or earlier) on the very first render
      data.value = cached
      error.value = null
      status.value = cached !== undefined ? 'success' : 'loading'
      if (cached !== undefined && !cache.isStale(k)) return Promise.resolve()
      return load(k)
    }

    const first = start(toValue(key))
    watch(
      () => toValue(key),
      (k, old) => {
        if (k !== old) void start(k)
      },
    )
    // SSG: wait for the data so it lands in the HTML
    if (getCurrentInstance()) onServerPrefetch(() => first)
    // Live mode: `start` already refetches a stale value in the background while the old one stays visible.
    if (getCurrentScope()) onScopeDispose(() => ctl?.abort())

    return {
      data: readonly(data) as Resource<T>['data'],
      error: readonly(error),
      status: readonly(status),
      refresh: async () => {
        const k = toValue(key)
        if (k !== null) await load(k, true)
      },
    }
  }
}

export const useResource = createUseResource(defaultCache)
