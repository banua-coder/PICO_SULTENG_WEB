import { expect } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { hydrated } from './a11y'

export type VisitOptions = { locale?: 'id' | 'en'; theme?: 'light' | 'dark'; reducedMotion?: boolean }

/** Collects console errors and warnings (not network 404 noise) and page errors from now on. Call before `visit`. */
export function watchConsole(page: Page) {
  const log: string[] = []
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && !/Failed to load resource/.test(m.text()) && log.push(`${m.type()}: ${m.text().slice(0, 200)}`))
  page.on('pageerror', (e) => log.push(`pageerror: ${e.message.slice(0, 200)}`))
  return log
}
export const expectNoConsoleErrors = (log: string[]) => expect(log).toEqual([])

/** Requests to one host, as path plus query. For asserting what the page does and does not fetch. */
export function watchRequests(page: Page, host = 'pico-api.banuacoder.com') {
  const seen: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    if (u.host === host) seen.push(u.pathname + u.search)
  })
  return seen
}

/**
 * Open a C5 path in a locale and theme, wait until the app has hydrated. `route` is the Indonesian path ('/data');
 * the English twin is derived. Theme goes in through localStorage before the first paint, like a returning visitor.
 */
export async function visit(page: Page, route: string, { locale = 'id', theme, reducedMotion }: VisitOptions = {}) {
  if (reducedMotion !== undefined) await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
  if (theme) await page.addInitScript((t) => localStorage.setItem('pico-theme', t), theme)
  const path = locale === 'en' ? (route === '/' ? '/en/' : `/en${route}`) : route
  await page.goto(path)
  await hydrated(page)
  return path
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

/** Pick an option of a shadcn Select (reka-ui combobox): open the trigger, click the option by its name. */
export async function chooseOption(page: Page, trigger: Locator, name: string | RegExp) {
  await trigger.click()
  await page.getByRole('option', { name, exact: typeof name === 'string' }).click()
  await expect(page.getByRole('listbox')).toBeHidden() // while it is open (and closing), the rest of the page is aria-hidden
}

/** A shadcn toggle group item (reka-ui) by its text. */
export const toggle = (page: Page, name: string, group?: string) =>
  (group ? page.getByRole('group', { name: group }) : page).locator('[data-slot="toggle-group-item"]', { hasText: new RegExp(`^${name}$`) })
