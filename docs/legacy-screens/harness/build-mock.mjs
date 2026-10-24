// Converts the NEW pico-api shapes (raw/*.json + pico-port fixtures) into the OLD Laravel/Fractal shapes.
// usage: node build-mock.mjs [fixturesDir]   -> writes mock.json
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
const FIX = process.argv[2] || path.join(os.homedir(), 'Documents/Projects/Web/pico-port/test/fixtures/api')
const HERE = path.dirname(new URL(import.meta.url).pathname)
const rd = (p) => JSON.parse(fs.readFileSync(p, 'utf8'))
const raw = (n) => { const j = rd(path.join(HERE, 'raw', n)); return Array.isArray(j.data) ? j.data : j.data.data }
const fix = (n) => { const j = rd(path.join(FIX, n)); return Array.isArray(j.data) ? j.data : (j.data.data ?? j.data) }
const ymd = (s) => s.slice(0, 10)
const n0 = (v) => v ?? 0
// sort by date (day numbers are not monotonic in the new API's last rows)
const byDay = (a, b) => (a.date ?? a.date_from ?? '').localeCompare(b.date ?? b.date_from ?? '') || a.day - b.day

// ---------- national / province daily (old id keys)
const natRows = raw('national.json').sort(byDay)
const nationalList = natRows.map((r) => ({
  hari_ke: r.day, tanggal: ymd(r.date),
  kasus_baru: { positif: r.daily.positive, sembuh: r.daily.recovered, meninggal: r.daily.deceased, dalam_perawatan: r.daily.active },
  kumulatif: { positif: r.cumulative.positive, sembuh: r.cumulative.recovered, meninggal: r.cumulative.deceased, dalam_perawatan: r.cumulative.active },
}))
const provRows = raw('prov72.json').sort(byDay)
const provinceList = provRows.map((r) => ({
  hari_ke: r.day, tanggal: ymd(r.date),
  kasus_baru: { positif: r.daily.positive, dalam_perawatan: r.daily.active, sembuh: r.daily.recovered, meninggal: r.daily.deceased, negatif: 0, ODP: n0(r.daily.odp?.active), PDP: n0(r.daily.pdp?.active) },
  aktif: { dalam_perawatan: r.cumulative.active, ODP: n0(r.cumulative.odp?.active), PDP: n0(r.cumulative.pdp?.active) },
  selesai: { ODP: n0(r.daily.odp?.finished), PDP: n0(r.daily.pdp?.finished) },
  kumulatif: { positif: r.cumulative.positive, sembuh: r.cumulative.recovered, meninggal: r.cumulative.deceased, negatif: 0, ODP: n0(r.cumulative.odp?.total), PDP: n0(r.cumulative.pdp?.total), selesai_ODP: n0(r.cumulative.odp?.finished), selesai_PDP: n0(r.cumulative.pdp?.finished) },
  rekap: { Rt: r.statistics.reproduction_rate.value, Rt_upper: r.statistics.reproduction_rate.upper_bound, Rt_lower: r.statistics.reproduction_rate.lower_bound },
}))

// ---------- regencies
const GEO = { 'Parigi Mautong': 'Parigi Mautong' } // geojson uses the legacy spelling, same as the API
const regList = fix('regencies.json')
const regDaily = regList.map((rg) => {
  const rows = raw(`reg${rg.id}.json`).sort(byDay)
  return {
    id: rg.id, name: rg.name,
    daily: rows.map((r) => ({
      hari_ke: r.day, nama: rg.name, tanggal: ymd(r.date),
      kasus_baru: { positif: r.positive, dalam_perawatan: r.positive - r.recovered - r.deceased, sembuh: r.recovered, meninggal: r.deceased, negatif: 0, ODP: n0(r.person_under_observation), PDP: n0(r.person_under_supervision) },
      aktif: { dalam_perawatan: r.cumulative_positive - r.cumulative_recovered - r.cumulative_deceased, ODP: 0, PDP: 0 },
      selesai: { ODP: n0(r.finished_person_under_observation), PDP: n0(r.finished_person_under_supervision) },
      kumulatif: { positif: r.cumulative_positive, sembuh: r.cumulative_recovered, meninggal: r.cumulative_deceased, negatif: 0, ODP: n0(r.cumulative_person_under_observation), PDP: n0(r.cumulative_person_under_supervision), selesai_ODP: 0, selesai_PDP: 0 },
      rekap: { Rt: r.rt, Rt_upper: r.rt_upper, Rt_lower: r.rt_lower },
    })),
  }
})
const regencies = regDaily.map((rg) => {
  const l = rg.daily[rg.daily.length - 1], k = l.kumulatif
  return {
    no: rg.id, kabupaten: GEO[rg.name] ?? rg.name, updated_at: l.tanggal,
    positif: k.positif, sembuh: k.sembuh, meninggal: k.meninggal, dalam_perawatan: l.aktif.dalam_perawatan,
    ODP: 0, selesai_pemantauan: 0, dalam_pemantauan: 0, PDP: 0, selesai_pengawasan: 0, dalam_pengawasan: 0,
    rasio_kematian: k.positif ? +((k.meninggal / k.positif) * 100).toFixed(2) : 0,
  }
})
// "kasus baru per kabupaten" bar chart: latest day on which any kabupaten had new positives (the true last day is all zeros)
const lastBusy = Math.max(...regDaily.map((rg) => Math.max(0, ...rg.daily.filter((d) => d.kasus_baru.positif > 0).map((d) => d.hari_ke))))
const regencyNewCase = regDaily.map((rg) => {
  const d = rg.daily.find((x) => x.hari_ke === lastBusy) ?? rg.daily[rg.daily.length - 1]
  return { nama: rg.name, tanggal: d.tanggal, kasus_baru: d.kasus_baru }
})

// ---------- provinces (map + table) with legacy map_id
const MAP = JSON.parse(fs.readFileSync('/tmp/legacy-site/public/assets/geojson/indonesia.json', 'utf8')).features.map((f) => f.properties)
const alias = { 'DAERAH ISTIMEWA YOGYAKARTA': 'DI YOGYAKARTA' }
const provinces = rd(path.join(FIX, 'provinces.json')).data.map((p) => {
  const nm = alias[p.name.toUpperCase()] ?? p.name.toUpperCase()
  const g = MAP.find((m) => m.name === nm)
  if (!g) console.warn('no map_id for', p.name)
  const c = p.latest_case.cumulative
  return { id: Number(p.id), name: p.name, positive: c.positive, recovered: c.recovered, deceased: c.deceased, under_treatment: c.active, map_id: g?.id ?? null,
    death_ratio: c.positive ? +((c.deceased / c.positive) * 100).toFixed(2) : 0, updated_at: ymd(p.latest_case.date) }
})

// ---------- tests
const idDate = (d) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(d)).replace(/,?\s/, ', ')
const tests = raw('tests.json')
const lastTest = (key) => { const t = tests.filter((x) => x.test_type.key === key).filter((x) => x.positive + x.negative + x.invalid + x.process > 0).sort(byDay).at(-1) // last row with any sampling
  return { [key]: { positif: t.positive, negatif: t.negative, invalid: t.invalid, proses: t.process, jumlah_sampling: t.positive + t.negative + t.invalid + t.process, tanggal: idDate(t.date_from) } } }
const testsOut = [lastTest('pcr'), lastTest('rdt')] // Data/Index reads tests[0]=pcr, tests[1]=rdt

// ---------- gender
const gl = fix('gender-latest.json'), A = ['0_14', '15_19', '20_24', '25_49', '50_54']
const age = (g) => ({ ...Object.fromEntries(A.map((k) => [k, g.age_groups[k]])), atas_55: g.age_groups['55_plus'] })
const genders = {
  hari_ke: gl.day,
  positif_per_usia: { semua: { laki_laki: age(gl.positive.male), perempuan: age(gl.positive.female) } },
  pdp_total_per_usia: { semua: { laki_laki: age(gl.pdp.male), perempuan: age(gl.pdp.female) } },
  positif: gl.positive.male.total + gl.positive.female.total,
  positif_per_gender: { laki_laki: gl.positive.male.total, perempuan: gl.positive.female.total },
  pdp_total: gl.pdp.male.total + gl.pdp.female.total,
  pdp_total_per_gender: { laki_laki: gl.pdp.male.total, perempuan: gl.pdp.female.total },
}

// ---------- vaccines
const G = ['elderly', 'public_officer', 'health_worker', 'public', 'teenager']
const vacOut = (rows) => {
  rows = rows.slice().sort(byDay)
  const r = rows.at(-1), p = rows.at(-2) ?? r
  const rate = (a, b) => (b ? +(((a - b) / b) * 100).toFixed(2) : 0)
  const o = { date: r.date, total_vaccination_target: r.target }
  for (const [dn, d] of [['first', 'dose_1'], ['second', 'dose_2']]) {
    o[`cumulative_${dn}_vaccination_received`] = r.total.cumulative[d]
    o[`${dn}_vaccination_received`] = r.total.daily[d]
    o[`${dn}_vaccination_received_changes_rate`] = rate(r.total.daily[d], p.total.daily[d])
    for (const g of G) {
      o[`${g}_vaccination_target`] = r.groups[g].target
      o[`cumulative_${g}_${dn}_vaccination_received`] = r.groups[g].cumulative[d]
      o[`${g}_${dn}_vaccination_received`] = r.groups[g].daily[d]
      o[`${g}_${dn}_vaccination_received_changes_rate`] = rate(r.groups[g].daily[d], p.groups[g].daily[d])
    }
  }
  return o
}

// ---------- contacts / pages
const CT = {
  1: { prefix: 'mailto:', icon: 'fas fa-envelope', bg_color: 'bg-red-500', label: 'Email' },
  2: { prefix: 'tel:', icon: 'fas fa-phone', bg_color: 'bg-blue-500', label: 'Telpon' },
  3: { prefix: 'tel:', icon: 'fas fa-fax', bg_color: 'bg-gray-600', label: 'Faks' },
  4: { prefix: '', icon: 'fas fa-globe', bg_color: 'bg-gray-600', label: 'Website' },
  5: { prefix: 'https://api.whatsapp.com/send?phone=', icon: 'fab fa-whatsapp', bg_color: 'bg-green-500', label: 'WA ke' },
  6: { prefix: 'https://t.me/', icon: 'fab fa-telegram', bg_color: 'bg-blue-500', label: 'Kirim Telegram ke' },
  7: { prefix: 'https://twitter.com/', icon: 'fab fa-twitter', bg_color: 'bg-blue-500', label: 'Twitter' },
  8: { prefix: 'https://instagram.com/', icon: 'fab fa-instagram', bg_color: 'bg-pink-600', label: 'Instagram' },
  9: { prefix: 'https://line.me/R/ti/p/', icon: 'fab fa-line', bg_color: 'bg-green-500', label: 'Line' },
}
const contact = (c) => { const id = c.contact_type_id ?? c.contact_type.id; return { id: c.id, contact_type_id: id, contact: c.contact, ...CT[id] } }
const hospitals = fix('hospitals.json').map((h) => ({ id: h.id, name: h.name, address: h.address, latitude: h.latitude, longitude: h.longitude, hospital_code: h.hospital_code, igd_count: h.igd_count, bed_update: '2021-08-01', contacts: h.contacts.map(contact) }))
const rgName = Object.fromEntries(regList.map((r) => [r.id, r.name]))
const taskForces = fix('task-forces.json').map((r) => ({ regency: r.regency_name, contacts: r.task_forces.flatMap((t) => t.contacts.map((c) => ({ ...contact(c), name: t.name }))) }))
const telemedicines = fix('telemedicines.json').map((t) => ({ name: t.name, is_free: t.is_free, contacts: t.contacts.map(contact), schedules: t.schedules }))
const donations = fix('donations.json').map((d) => ({ id: d.id, title: d.title, description: d.description, initiator: d.initiator, url: d.url, image: d.image, accept_noncash: d.accept_noncash, delivery_address: d.delivery_address ?? '',
  accounts: d.bank_accounts.map((b) => ({ id: b.id, name: b.account_name, number: b.account_number, bank: b.bank.name, bank_logo: b.bank.logo })), contacts: d.contacts.map(contact) }))
const vaccineLocations = fix('vaccine-locations.json').map((v) => ({ name: v.name, regency_name: rgName[v.regency_id] ?? '', address: v.address, operational_time: v.operational_time, is_first_vaccination: v.is_first_vaccination, is_second_vaccination: v.is_second_vaccination, daily_vaccination_quota: v.daily_vaccination_quota, vaccination_stock_remaining: v.vaccination_stock_remaining, notes: v.notes, updated_at: '2021-07-15' }))
const infographics = fix('infographics.json').map((i) => ({ title: i.title, route: i.source, images: i.images.sort((a, b) => a.queue - b.queue).map((x, n) => `/ph/info?n=${n + 1}&t=${encodeURIComponent(i.title)}`) })) // original i.ibb.co images are dead -> placeholders
const banners = fix('banners.json').map((b) => ({ id: b.id, title: b.title, image: `/ph/banner?t=${encodeURIComponent(b.title)}`, url_type: '', url: b.link, status: true }))
const partners = fix('partners.json').map((p) => ({ id: p.id, name: p.name, link: p.link, image: p.image }))

const out = {
  api: {
    statistics: nationalList, 'statistics?province': provinceList,
    'statistics/latest': nationalList.at(-1), 'statistics/latest?province': provinceList.at(-1),
    provinces, regencies, 'regencies/all': regDaily,
    tests: testsOut, 'vaccine/latest': vacOut(fix('vaccination-national.json')), 'vaccine/latest?province': vacOut(fix('vaccination-province.json')),
    // harness workaround: MapCard's `villages` watcher overwrites map data after load; returning kabupaten rows keeps the Sulteng choropleth populated
    'villages/latest': regencies,
  },
  pages: {
    '/': ['Home/Index', { banners, hospitals: hospitals.slice(0, 3), infographics: infographics.slice(0, 5) }],
    '/data': ['Data/Index', { tests: testsOut, regencies, provinces, genders, regencyNewCase }],
    '/vaksin': ['Vaccine/Index', { vaccineLocations }],
    '/tabel-data': ['Table/Index', {}],
    '/isoman': ['Isolation/Index', { telemedicines, donations }],
    '/kontak': ['Contact/Index', { hospitals, taskForces }],
    '/wiki': ['Wiki/Index', {}],
    '/infografis': ['Infographic/Index', { infographics }],
  },
  partners,
}
fs.writeFileSync(path.join(HERE, 'mock.json'), JSON.stringify(out))
console.log('mock.json', (fs.statSync(path.join(HERE, 'mock.json')).size / 1e6).toFixed(1) + 'MB', 'lastBusyDay', lastBusy)
