import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchJson } from './client'
import { RETRY_DELAY_MS, TIMEOUT_MS } from './config'
import { ApiException } from './errors'
import { hasShape } from './guards'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const stub = (impl: (url: string, init: RequestInit) => Promise<Response>) => {
  const f = vi.fn(impl)
  vi.stubGlobal('fetch', f)
  return f
}
const fail = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e
  }
  throw new Error('did not throw')
}
const fast = { retryDelayMs: 1 }

afterEach(() => vi.unstubAllGlobals())

describe('fetchJson', () => {
  it('has the specced defaults', () => {
    expect(TIMEOUT_MS).toBe(15_000)
    expect(RETRY_DELAY_MS).toBe(1_000)
  })

  it('builds the URL from the base and unwraps the envelope', async () => {
    const f = stub(async () => json({ status: 'success', data: { data: [{ a: 1 }], pagination: {} } }))
    await expect(fetchJson('/national?all=true', fast)).resolves.toEqual([{ a: 1 }])
    expect(f.mock.calls[0]?.[0]).toBe('https://pico-api.banuacoder.com/api/v1/national?all=true')
  })

  it('HTTP 500 gives kind http with the status and is not retried', async () => {
    const f = stub(async () => json({ status: 'error', error: 'x' }, 500))
    const e = await fail(fetchJson('/x', fast))
    expect(e).toMatchObject({ kind: 'http', status: 500 })
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('HTTP 404 with a non-JSON body still gives http', async () => {
    stub(async () => new Response('<html>', { status: 404 }))
    expect(await fail(fetchJson('/x', fast))).toMatchObject({ kind: 'http', status: 404 })
  })

  it('a status:error body in a 200 gives http', async () => {
    stub(async () => json({ status: 'error', error: 'x' }))
    expect(await fail(fetchJson('/x', fast))).toMatchObject({ kind: 'http' })
  })

  it('invalid JSON gives shape', async () => {
    stub(async () => new Response('not json', { status: 200 }))
    expect(await fail(fetchJson('/x', fast))).toMatchObject({ kind: 'shape' })
  })

  it('a guard failure gives shape', async () => {
    stub(async () => json({ status: 'success', data: { id: 'x' } }))
    const guard = hasShape<{ id: number }>({ id: 'number' })
    expect(await fail(fetchJson('/x', { ...fast, guard }))).toMatchObject({ kind: 'shape' })
  })

  it('a guard pass returns the typed payload', async () => {
    stub(async () => json({ status: 'success', data: { id: 7 } }))
    const guard = hasShape<{ id: number }>({ id: 'number' })
    await expect(fetchJson('/x', { ...fast, guard })).resolves.toEqual({ id: 7 })
  })

  it('a network failure retries once and succeeds', async () => {
    let n = 0
    const f = stub(async () => {
      if (++n === 1) throw new TypeError('Failed to fetch')
      return json({ status: 'success', data: 1 })
    })
    await expect(fetchJson('/x', fast)).resolves.toBe(1)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('two network failures give kind network after exactly one retry', async () => {
    const f = stub(async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await fail(fetchJson('/x', fast))).toMatchObject({ kind: 'network' })
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('a timeout gives kind network', async () => {
    stub((_u, init) => new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(init.signal?.reason))))
    expect(await fail(fetchJson('/x', { ...fast, timeoutMs: 10 }))).toMatchObject({ kind: 'network' })
  })

  it('the caller abort rejects with AbortError, is not retried and is not an ApiException', async () => {
    const f = stub((_u, init) => new Promise((_res, rej) => init.signal?.addEventListener('abort', () => rej(init.signal?.reason))))
    const ctl = new AbortController()
    const p = fail(fetchJson('/x', { signal: ctl.signal, ...fast }))
    ctl.abort()
    const e = await p
    expect(e).toBeInstanceOf(DOMException)
    expect((e as DOMException).name).toBe('AbortError')
    expect(e).not.toBeInstanceOf(ApiException)
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('an already aborted signal never calls fetch', async () => {
    const f = stub(async () => json({ status: 'success', data: 1 }))
    const ctl = new AbortController()
    ctl.abort()
    expect(await fail(fetchJson('/x', { signal: ctl.signal }))).toBeInstanceOf(DOMException)
    expect(f).not.toHaveBeenCalled()
  })

  it('aborting during the retry wait stops the retry', async () => {
    const f = stub(async () => {
      throw new TypeError('Failed to fetch')
    })
    const ctl = new AbortController()
    const p = fail(fetchJson('/x', { signal: ctl.signal, retryDelayMs: 5_000 }))
    await new Promise((r) => setTimeout(r, 10))
    ctl.abort()
    expect((await p) as DOMException).toMatchObject({ name: 'AbortError' })
    expect(f).toHaveBeenCalledTimes(1)
  })
})
