import { unwrap } from '@/api/envelope'

const files = import.meta.glob<unknown>('./api/*.json', { eager: true, import: 'default' })

/** The unwrapped payload of a recorded live response, e.g. fx('province-72-cases'). */
export function fx<T = unknown>(name: string): T {
  const raw = files[`./api/${name}.json`]
  if (!raw) throw new Error(`no fixture ${name}`)
  return unwrap<T>(structuredClone(raw))
}
