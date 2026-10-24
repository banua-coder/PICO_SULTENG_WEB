import type { ApiError, ApiErrorKind } from './types'

/** Thrown by the data layer. Satisfies the C2 `ApiError` shape. */
export class ApiException extends Error implements ApiError {
  readonly kind: ApiErrorKind
  readonly status?: number
  constructor(kind: ApiErrorKind, status?: number, message?: string) {
    super(message ?? (status ? `${kind} ${status}` : kind))
    this.name = 'ApiException'
    this.kind = kind
    if (status !== undefined) this.status = status
  }
}

export const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === 'AbortError'
