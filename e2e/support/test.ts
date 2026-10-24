import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test as base, expect } from '@playwright/test'
import { ENDPOINTS } from '../../src/api/endpoints'

const dir = fileURLToPath(new URL('../../test/fixtures/api/', import.meta.url))
const byPath = new Map<string, string>(Object.values(ENDPOINTS).map((e) => [e.path, e.name]))

/** `test` whose pages talk to a fixture-backed pico-api (ADR-0103): no spec depends on the live API. W27 extends this. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('https://pico-api.banuacoder.com/api/v1/**', (route) => {
      const u = new URL(route.request().url())
      const key = `${u.pathname.replace('/api/v1', '')}${u.search}`
      const name = byPath.get(key)
      if (!name) return route.fulfill({ status: 404, contentType: 'application/json', body: '{"status":"error","error":"not in fixtures"}' })
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(`${dir}${name}.json`, 'utf8') })
    })
    // Third-party images (i.ibb.co and others) are not under test and some hosts are unreachable from some networks: a hanging
    // image holds back the `load` event for the whole test timeout. Fail them at once. A spec can route them itself, which wins.
    await page.route(
      (u) => !['localhost', 'pico-api.banuacoder.com'].includes(u.hostname),
      (r) => (r.request().resourceType() === 'image' ? r.abort('failed') : r.continue()),
    )
    await use(page)
  },
})
export { expect }
