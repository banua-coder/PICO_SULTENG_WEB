import type { Ref } from 'vue'

// Contract C2: shared by the data layer and its consumers. Domain types are added by W08.
export type ApiErrorKind = 'network' | 'http' | 'shape'
export type ApiError = { kind: ApiErrorKind; status?: number }

export type ResourceStatus = 'idle' | 'loading' | 'success' | 'error'

export type Resource<T> = {
  data: Readonly<Ref<T | undefined>>
  error: Readonly<Ref<ApiError | null>>
  status: Readonly<Ref<ResourceStatus>>
  refresh: () => Promise<void>
}
