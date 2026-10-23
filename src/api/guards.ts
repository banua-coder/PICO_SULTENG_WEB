// Small hand-written guards (no runtime schema library). A guard checks only the fields this site reads.
// W08 adds one guard per wire type next to the wire types.
export const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

export const isArrayOf =
  <T>(item: (v: unknown) => v is T) =>
  (v: unknown): v is T[] =>
    Array.isArray(v) && v.every(item)

/** Guard for a record that has the given keys with the given `typeof` types. */
export const hasShape =
  <T extends Record<string, unknown>>(shape: { [K in keyof T]: 'string' | 'number' | 'boolean' | 'object' | 'any' }) =>
  (v: unknown): v is T =>
    isRecord(v) && Object.entries(shape).every(([k, t]) => k in v && (t === 'any' || typeof v[k] === t))
