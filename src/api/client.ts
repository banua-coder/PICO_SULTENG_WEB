import { apiBaseUrl, RETRY_DELAY_MS, TIMEOUT_MS } from './config'
import { unwrap } from './envelope'
import { ApiException } from './errors'

export type FetchJsonOptions<T> = {
  /** Caller abort. Rejects with an `AbortError` (never an `ApiException`) and is never retried. */
  signal?: AbortSignal
  /** Checks the unwrapped payload. A failure throws `ApiException('shape')`. */
  guard?: (v: unknown) => v is T
  timeoutMs?: number
  retryDelayMs?: number
}

const abortError = () => new DOMException('The request was aborted', 'AbortError')

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** One attempt. Maps every failure to an `ApiException` or, for a caller abort, an `AbortError`. */
async function attempt(url: string, signal: AbortSignal | undefined, timeoutMs: number): Promise<unknown> {
  if (signal?.aborted) throw abortError()
  const ctl = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    ctl.abort()
  }, timeoutMs)
  const onCallerAbort = () => ctl.abort()
  signal?.addEventListener('abort', onCallerAbort, { once: true })
  try {
    let res: Response
    try {
      res = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } })
    } catch {
      if (signal?.aborted) throw abortError()
      throw new ApiException('network', undefined, timedOut ? `timeout after ${timeoutMs} ms` : 'network failure')
    }
    let body: unknown
    try {
      body = await res.json()
    } catch {
      if (signal?.aborted) throw abortError()
      // timed out while reading the body is still a network problem
      if (timedOut) throw new ApiException('network', undefined, 'timeout')
      if (!res.ok) throw new ApiException('http', res.status)
      throw new ApiException('shape', undefined, 'body is not JSON')
    }
    if (!res.ok) throw new ApiException('http', res.status)
    return unwrap(body, res.status)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}

/**
 * GET a pico-api path and return the unwrapped payload (C1 envelopes V1 to V4).
 * 15 s timeout, one retry after 1 s for network errors only.
 */
export async function fetchJson<T = unknown>(path: string, opts: FetchJsonOptions<T> = {}): Promise<T> {
  const { signal, guard, timeoutMs = TIMEOUT_MS, retryDelayMs = RETRY_DELAY_MS } = opts
  const url = `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  let payload: unknown
  try {
    payload = await attempt(url, signal, timeoutMs)
  } catch (e) {
    if (!(e instanceof ApiException) || e.kind !== 'network') throw e
    await sleep(retryDelayMs, signal)
    payload = await attempt(url, signal, timeoutMs)
  }
  if (guard && !guard(payload)) throw new ApiException('shape', undefined, `guard failed for ${path}`)
  return payload as T
}
