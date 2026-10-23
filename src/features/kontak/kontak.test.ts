import { afterEach, describe, expect, it } from 'vitest'
import { cache } from '@/api/cache'
import { ENDPOINTS } from '@/api/endpoints'
import { hospitals as toHospitals, taskForces as toTaskForces } from '@/api/normalize/content'
import { areaBySlug } from '@/app/areas'
import { fx, type WireHospital, type WireTaskForceGroup } from '../../../test/fixtures/load'
import { flush, mountApp } from '../../../test/support/mount'
import KontakView from './KontakView.vue'
import { filterHospitals, filterTaskForces, osmUrl, parseKabupaten } from './useKontakPage'

afterEach(() => cache.clear())
const hospitals = () => toHospitals(fx<WireHospital[]>('hospitals'))
const taskForces = () => toTaskForces(fx<WireTaskForceGroup[]>('task-forces'))
const seed = () => cache.seed({ [ENDPOINTS.hospitals.path]: hospitals(), [ENDPOINTS.taskForces.path]: taskForces() })
const palu = areaBySlug('kabupaten', 'kota-palu')!

describe('logic', () => {
  it('filters both lists by kabupaten and sorts them', () => {
    const h = filterHospitals(hospitals(), palu)
    expect(h.length).toBeGreaterThan(0)
    expect(h.every((x) => x.kabupaten?.code === '7271')).toBe(true)
    expect(filterHospitals(hospitals(), null)).toHaveLength(hospitals().length)
    expect(filterTaskForces(taskForces(), palu).map((g) => g.kabupaten.slug)).toEqual(['kota-palu'])
    expect(parseKabupaten('kota-palu')?.code).toBe('7271')
    expect([parseKabupaten('bali'), parseKabupaten(undefined), parseKabupaten('')]).toEqual([null, null, null])
  })
  it('builds the OpenStreetMap link from coordinates only', () => {
    expect(osmUrl({ lat: -0.9, lon: 119.8 })).toBe('https://www.openstreetmap.org/?mlat=-0.9&mlon=119.8#map=17/-0.9/119.8')
    expect(osmUrl(null)).toBeNull()
  })
  it('no contact link in any fixture uses a scheme outside https, tel and mailto', () => {
    const contacts = [...hospitals().flatMap((h) => h.contacts), ...taskForces().flatMap((g) => g.members.flatMap((m) => m.contacts))]
    expect(contacts.length).toBeGreaterThan(20)
    for (const c of contacts) expect(c.href === '' || /^(https:|tel:|mailto:)/.test(c.href), `${c.kind} ${c.label} -> ${c.href}`).toBe(true)
    expect(contacts.filter((c) => c.kind === 'fax').every((c) => c.href === '')).toBe(true)
  })
})

describe('KontakView', () => {
  it('shows the archive notice with the 119 TODO, an article per hospital with a captioned bed table', async () => {
    seed()
    const { wrapper } = await mountApp(KontakView, {}, '/kontak')
    await flush()
    expect(wrapper.find('h1').text()).toBe('Kontak')
    expect(wrapper.find('[data-testid="archive-notice"]').text()).toContain('hubungi 119')
    expect(wrapper.find('[data-todo="kontak-119"]').exists()).toBe(true)
    const cards = wrapper.findAll('article')
    expect(cards).toHaveLength(hospitals().length)
    expect(cards[0]!.find('h3').exists()).toBe(true)
    expect(cards[0]!.find('caption').text()).toContain('per data terakhir')
    expect(wrapper.html()).not.toContain('0811404119')
  })

  it('?kabupaten narrows hospitals and task forces; the select reflects it', async () => {
    seed()
    const { wrapper } = await mountApp(KontakView, {}, '/kontak?kabupaten=kota-palu')
    await flush()
    expect(wrapper.findAll('article')).toHaveLength(filterHospitals(hospitals(), palu).length)
    expect(wrapper.findAll('section h3').filter((h) => h.attributes('id')?.startsWith('tf-'))).toHaveLength(1)
    expect((wrapper.find('select').element as HTMLSelectElement).value).toBe('kota-palu')
  })

  it('the map link opens a new tab, only for a hospital with coordinates', async () => {
    seed()
    const { wrapper } = await mountApp(KontakView, {}, '/kontak')
    await flush()
    const links = wrapper.findAll('a[href^="https://www.openstreetmap.org/"]')
    expect(links.length).toBe(hospitals().filter((h) => h.location).length)
    expect(links[0]!.attributes('target')).toBe('_blank')
    expect(links[0]!.attributes('rel')).toContain('noopener')
  })
})
