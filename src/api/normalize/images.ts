/**
 * C1 Q7 resolver. An absolute https URL whose host is not the expired banuacoders.com is used as is.
 * Everything else (relative paths, bare file names, http:, expired host, junk) is null: show the missing-image state.
 */
export function resolveImage(src: string | null | undefined): string | null {
  if (!src) return null
  let u: URL
  try {
    u = new URL(src.trim())
  } catch {
    return null // relative path or bare file name
  }
  if (u.protocol !== 'https:') return null
  if (u.hostname === 'banuacoders.com' || u.hostname.endsWith('.banuacoders.com')) return null
  return u.href === src.trim() ? src.trim() : u.href
}

/** A link that is safe to render: https only, else null. */
export function resolveLink(href: string | null | undefined): string | null {
  if (!href) return null
  try {
    const u = new URL(href.trim())
    return u.protocol === 'https:' ? u.href : null
  } catch {
    return null
  }
}
