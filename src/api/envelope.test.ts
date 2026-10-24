import { describe, expect, it } from 'vitest'
import { unwrap } from './envelope'
import { ApiException } from './errors'

const kindOf = (fn: () => unknown) => {
  try {
    fn()
  } catch (e) {
    return e instanceof ApiException ? { kind: e.kind, status: e.status } : e
  }
}

describe('unwrap', () => {
  it('V1 single object', () => {
    expect(unwrap({ status: 'success', data: { id: 1 } })).toEqual({ id: 1 })
  })
  it('V2/V3 paginated list returns the inner array', () => {
    const body = { status: 'success', data: { data: [1, 2], pagination: { page: 1 } } }
    expect(unwrap(body)).toEqual([1, 2])
  })
  it('V2/V3 with all=true and V4 plain list return the array', () => {
    expect(unwrap({ status: 'success', data: [1, 2, 3] })).toEqual([1, 2, 3])
  })
  it('an object with its own data field but no pagination is a V1 object', () => {
    expect(unwrap({ status: 'success', data: { data: [1], label: 'x' } })).toEqual({ data: [1], label: 'x' })
  })
  it('status error gives http with the response status', () => {
    expect(kindOf(() => unwrap({ status: 'error', error: 'tidak ditemukan' }, 404))).toEqual({ kind: 'http', status: 404 })
  })
  it('status error inside a 200 still gives http (500 fallback)', () => {
    expect(kindOf(() => unwrap({ status: 'error', error: 'x' }, 200))).toEqual({ kind: 'http', status: 500 })
  })
  it.each([[null], ['text'], [[]], [{}], [{ status: 'success' }], [{ status: 'weird', data: 1 }]])('bad body %j gives shape', (body) => {
    expect(kindOf(() => unwrap(body))).toEqual({ kind: 'shape', status: undefined })
  })
})
