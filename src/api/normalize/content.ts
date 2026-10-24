import { kabupatenRef } from '@/app/areas'
import type { Banner, Donation, Hospital, Infographic, Partner, TaskForceGroup, Telemedicine } from '../types'
import type { WireBanner, WireDonation, WireHospital, WireInfographic, WirePartner, WireTaskForceGroup, WireTelemedicine } from '../wire'
import { flatContacts, nestedContacts } from './contacts'
import { resolveImage, resolveLink } from './images'

const validLocation = (lat?: number, lon?: number) =>
  Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat!) <= 90 && Math.abs(lon!) <= 180 && !(lat === 0 && lon === 0) ? { lat: lat!, lon: lon! } : null

export const hospitals = (wire: WireHospital[]): Hospital[] =>
  wire.map((h) => ({
    code: h.hospital_code,
    location: validLocation(h.latitude, h.longitude),
    name: h.name.trim(),
    kabupaten: kabupatenRef(h.regency_id),
    address: h.address.trim(),
    contacts: flatContacts(h.contacts),
    beds: h.beds.map((b) => ({ type: b.bed_type_name, available: b.available, total: b.total })),
    igdCount: h.igd_count,
  }))

/** Groups whose regency is not a known kabupaten are dropped. */
export const taskForces = (wire: WireTaskForceGroup[]): TaskForceGroup[] =>
  wire.flatMap((g) => {
    const kabupaten = kabupatenRef(g.regency_id)
    return kabupaten ? [{ kabupaten, members: g.task_forces.map((t) => ({ name: t.name.trim(), contacts: flatContacts(t.contacts) })) }] : []
  })

export const banners = (wire: WireBanner[]): Banner[] =>
  wire.filter((b) => b.is_active !== false).map((b) => ({ id: b.id, title: b.title, href: resolveLink(b.link), image: resolveImage(b.image) }))

/** Images ordered by `queue`. Unusable URLs are dropped. `source` is kept only if it is an https link. */
export const infographics = (wire: WireInfographic[]): Infographic[] =>
  wire.map((i) => ({
    id: i.id,
    title: i.title,
    source: resolveLink(i.source),
    images: [...i.images].sort((a, b) => a.queue - b.queue).flatMap((im) => resolveImage(im.image_url) ?? []),
  }))

export const donations = (wire: WireDonation[]): Donation[] =>
  wire.map((d) => ({
    id: d.id,
    title: d.title,
    initiator: d.initiator,
    href: resolveLink(d.url),
    description: d.description,
    image: resolveImage(d.image),
    acceptsGoods: d.accept_noncash,
    deliveryAddress: d.delivery_address?.trim() || null,
    accounts: d.bank_accounts.map((a) => ({
      bank: a.bank.name,
      bankShort: a.bank.nickname,
      number: a.account_number,
      holder: a.account_name,
      logo: resolveImage(a.bank.logo),
    })),
    contacts: nestedContacts(d.contacts),
  }))

export const telemedicines = (wire: WireTelemedicine[]): Telemedicine[] =>
  wire.map((t) => ({
    id: t.id,
    name: t.name,
    free: t.is_free,
    schedules: t.schedules.map((s) => ({ days: s.operational_day, hours: s.operational_time, tz: s.timezone })),
    contacts: nestedContacts(t.contacts),
  }))

// The API gives a file name that lived on the old banuacoders.com host (gone). The logos are copies in public/partners, from the owner's
// old site and pico-api-docs (see NOTICE); a partner without a copy shows its name as text.
const LOGOS: Record<string, string> = {
  'detexi.png': 'detexi',
  'kawalcovid.png': 'kawalcovid',
  'ehi.png': 'kawalcorona',
  'inacovid.png': 'inacovid',
  'vue.svg': 'vuejs',
  'dinkes.png': 'dinkes',
  'sultenglawancovid.png': 'sultenglawancovid',
  'banuacoders.png': 'banuacoders',
  'pikobar.png': 'pikobar',
}
const logoOf = (image: string): string | null => (LOGOS[image] ? `/partners/${LOGOS[image]}.webp` : null)

/** `href` is dropped to '' if it is not https. `logo` is the local copy of the partner's logo, or null. */
export const partners = (wire: WirePartner[]): Partner[] =>
  wire.map((p) => ({ id: p.id, name: p.name, href: resolveLink(p.link) ?? '', inFooter: p.in_footer, logo: logoOf(p.image) }))
