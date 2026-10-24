// The banner and donation pictures were uploaded to the old banuacoders.com host and are gone from it. The owner's backup of that storage has
// them: public/media/{banners,donations}/<file>.webp (resized copies, see NOTICE). Only pictures without a private person's phone number, bank
// account or face were kept: of the 8 donation posters 7 were removed (see NOTICE). The API still names them as `donations/<month>/<file>` or
// `https://banuacoders.com/corona/assets/banners/<month>/<file>`. Anything not in the backup stays null.
const MEDIA = {
  banners: new Set(['BKxXPuJeW96bctsOwoRE', 'gx8s3YxwR7Jb1RiPfWmJ', 'oq7QUMpa6fGfBZuqE7H0', 'yjQD3jF6u7NWfKiq0lvS']),
  donations: new Set(['scScOVbu9VH0Zx09DOad']),
} as const
export function localMedia(src: string): string | null {
  const m = /^(?:https:\/\/(?:www\.)?banuacoders\.com\/corona\/assets\/|\/?(?:storage\/)?)(banners|donations)\/[A-Za-z]+\d{4}\/([A-Za-z0-9]+)\.(?:png|jpe?g)$/.exec(src.trim())
  const kind = m?.[1] as keyof typeof MEDIA | undefined
  return kind && m?.[2] && MEDIA[kind].has(m[2]) ? `/media/${kind}/${m[2]}.webp` : null
}

/**
 * C1 Q7 resolver. An absolute https URL whose host is not the expired banuacoders.com is used as is.
 * Everything else (relative paths, bare file names, http:, expired host, junk) is null: show the missing-image state.
 */
export function resolveImage(src: string | null | undefined): string | null {
  if (!src) return null
  const local = localMedia(src)
  if (local) return local
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
