import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

/** axe with WCAG 2.2 A and AA tags. Zero violations allowed (ADR-0103). W27 reuses this. */
export async function expectNoA11yViolations(page: Page) {
  // let colour transitions (a button turning enabled, a dialog fading) finish: axe would read a colour in the middle of one
  await page.evaluate(() => Promise.allSettled(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)))
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
}

/** Resolves once the app has hydrated (AppLayout sets body[data-hydrated]). */
export const hydrated = (page: Page) => page.waitForFunction(() => document.body.dataset.hydrated === 'true')
