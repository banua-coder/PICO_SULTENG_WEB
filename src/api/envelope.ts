import { ApiException } from './errors'
import { isRecord } from './guards'

/**
 * Unwrap the four C1 envelopes into the payload:
 *   V1 { status, data: T }                                  -> T
 *   V2/V3 { status, data: { data: T[], pagination } }       -> T[]
 *   V4 { status, data: T[] }                                -> T[]
 * An error body or a body of another shape throws.
 * The web always asks for the whole list (all=true / load_all=true), so pagination is dropped.
 */
export function unwrap<T>(body: unknown, httpStatus = 200): T {
  if (!isRecord(body)) throw new ApiException('shape')
  if (body.status === 'error') throw new ApiException('http', httpStatus >= 400 ? httpStatus : 500)
  if (body.status !== 'success' || !('data' in body)) throw new ApiException('shape')
  const d = body.data
  if (isRecord(d) && Array.isArray(d.data) && isRecord(d.pagination)) return d.data as T
  return d as T
}
