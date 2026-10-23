import type { Contact, ContactKind } from '../types'
import type { WireFlatContact, WireNestedContact } from '../wire'

// C1 contact types (stable ids). `icon` and `bg_color` from the API are old Font Awesome and Tailwind class names: ignored.
const KIND_BY_TYPE_ID: Record<number, ContactKind> = {
  1: 'email',
  2: 'phone',
  3: 'fax',
  4: 'website',
  5: 'whatsapp',
  6: 'telegram',
  7: 'twitter',
  8: 'instagram',
  9: 'line',
}

const PROFILE_BASE: Partial<Record<ContactKind, string>> = {
  telegram: 'https://t.me/',
  twitter: 'https://twitter.com/',
  instagram: 'https://instagram.com/',
  line: 'https://line.me/R/ti/p/',
}

const handle = (v: string) => v.trim().replace(/^@/, '').replace(/^https?:\/\/[^/]+\//i, '')

function websiteHref(raw: string): string {
  const v = raw.trim()
  if (/^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)) return '' // javascript:, data:, ...
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
    return u.hostname.includes('.') ? `https://${u.host}${u.pathname}${u.search}${u.hash}` : ''
  } catch {
    return ''
  }
}

/** Indonesian numbers: 08xx and +62 8xx become 628xx, which is what wa.me style links need. */
const waNumber = (raw: string): string => {
  const d = raw.replace(/\D/g, '')
  return d.startsWith('0') ? `62${d.slice(1)}` : d
}

function hrefFor(kind: ContactKind, raw: string): string {
  const v = raw.trim()
  switch (kind) {
    case 'email':
      return /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v) ? `mailto:${v}` : ''
    case 'phone': {
      const n = v.replace(/[^\d+]/g, '')
      return n.replace(/\D/g, '').length >= 5 ? `tel:${n}` : ''
    }
    case 'fax':
      return '' // shown as text
    case 'website':
      return websiteHref(v)
    case 'whatsapp': {
      const n = waNumber(v)
      return n ? `https://api.whatsapp.com/send?phone=${n}` : ''
    }
    default: {
      const h = handle(v)
      return h ? `${PROFILE_BASE[kind]}${encodeURIComponent(h)}` : ''
    }
  }
}

export function makeContact(typeId: number, value: string): Contact | null {
  const kind = KIND_BY_TYPE_ID[typeId]
  const label = value.trim()
  if (!kind || !label) return null
  return { kind, label, href: hrefFor(kind, label) }
}

export const flatContacts = (list: WireFlatContact[]): Contact[] =>
  list.flatMap((c) => makeContact(c.contact_type_id, c.contact) ?? [])

export const nestedContacts = (list: WireNestedContact[]): Contact[] =>
  list.flatMap((c) => makeContact(c.contact_type.id, c.contact) ?? [])
