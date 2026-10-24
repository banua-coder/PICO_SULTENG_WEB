import type { Page } from '@playwright/test'
import { expect, test } from './support/test'
import { expectNoA11yViolations } from './support/a11y'
import { horizontalOverflow, visit, watchConsole } from './support/visit'

const LIST = '**/api/v1/infographics**'
const IMAGES = '**/i.ibb.co/**'
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

// 60 items in the wire shape, three images each
const wireList = (n = 60) => ({
  status: 'success',
  data: Array.from({ length: n }, (_, k) => ({
    id: n - k,
    title: `Infografis nomor ${n - k}`,
    source: `https://www.instagram.com/p/x${n - k}/`,
    images: [1, 2, 3].map((q) => ({ id: (n - k) * 10 + q, queue: q, image_url: `https://i.ibb.co/id${n - k}/${q}.jpg` })),
  })),
})
const serveList = (page: Page) =>
  page.route(LIST, (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(wireList()) }))

test.describe('Infografis', () => {
  test('?id opens the viewer after load, Escape closes it, id leaves the URL and focus returns to the card', async ({ page }) => {
    await serveList(page)
    await page.route(IMAGES, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
    await visit(page, '/infografis?id=55')
    const dlg = page.getByRole('dialog', { name: 'Infografis nomor 55' })
    await expect(dlg).toBeVisible()
    await expect(dlg).toContainText('1 dari 3')
    await expect(dlg.getByRole('link', { name: 'Lihat sumber' })).toHaveAttribute('href', 'https://www.instagram.com/p/x55/')
    await page.keyboard.press('Escape')
    await expect(dlg).toBeHidden()
    await expect(page).not.toHaveURL(/id=/)

    // from a card: focus returns to it
    const card = page.locator('button[data-id="60"]')
    await card.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/id=60/)
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(card).toBeFocused()
  })

  test('arrow keys and the buttons move through the images; focus stays inside the dialog', async ({ page }) => {
    await serveList(page)
    await page.route(IMAGES, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
    await visit(page, '/infografis?id=7')
    const dlg = page.getByRole('dialog')
    await expect(dlg).toContainText('1 dari 3')
    await dlg.getByRole('button', { name: 'Gambar berikutnya' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(dlg).toContainText('2 dari 3')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await expect(dlg).toContainText('1 dari 3') // wraps
    await page.keyboard.press('ArrowLeft')
    await expect(dlg).toContainText('3 dari 3')
    await expect(dlg.getByRole('img')).toHaveAttribute('alt', 'Infografis nomor 7, gambar 3 dari 3')
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab')
      // a modal dialog lets Tab pass through the browser UI (body) but never to the inert page behind
      expect(await page.evaluate(() => document.activeElement === document.body || !!document.activeElement?.closest('dialog'))).toBe(true)
    }
  })

  test('a swipe on the image moves to the next one and back', async ({ page }) => {
    await serveList(page)
    await page.route(IMAGES, (r) => r.fulfill({ status: 200, contentType: 'image/png', body: PNG }))
    await visit(page, '/infografis?id=7')
    const dlg = page.getByRole('dialog')
    const box = (await dlg.locator('img').boundingBox())!
    const y = box.y + box.height / 2
    await page.mouse.move(box.x + box.width - 20, y)
    await page.mouse.down()
    await page.mouse.move(box.x + 20, y, { steps: 5 })
    await page.mouse.up()
    await expect(dlg).toContainText('2 dari 3')
    await page.mouse.move(box.x + 20, y)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width - 20, y, { steps: 5 })
    await page.mouse.up()
    await expect(dlg).toContainText('1 dari 3')
  })

  test('all images blocked: placeholders with titles, no layout shift, no console error but the failed loads', async ({ page }) => {
    await serveList(page)
    await page.route(IMAGES, (r) => r.abort('failed'))
    const log = watchConsole(page)
    await visit(page, '/infografis')
    const card = page.locator('button[data-id="60"]')
    await expect(card).toContainText('Infografis nomor 60')
    await expect(card.locator('[data-placeholder="plate"]')).toBeVisible()
    const h1 = (await card.boundingBox())!.height
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))) // let a couple of frames pass
    expect((await card.boundingBox())!.height).toBe(h1)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    expect(log).toEqual([])
  })

  test('the viewer says the image cannot be loaded, offers a retry, and the source link', async ({ page }) => {
    await serveList(page)
    let fail = true
    await page.route(IMAGES, (r) => (fail ? r.abort('failed') : r.fulfill({ status: 200, contentType: 'image/png', body: PNG })))
    await visit(page, '/infografis?id=12')
    const dlg = page.getByRole('dialog')
    await expect(dlg).toContainText('Gambar tidak dapat dimuat')
    await expect(dlg.getByRole('link', { name: 'Lihat sumber' })).toBeVisible()
    fail = false
    await dlg.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(dlg.locator('[data-failed]')).toHaveCount(0)
    await expect(dlg.locator('img')).toBeVisible()
  })

  test('only the first 24 card images are requested; "Muat lagi" brings 24 more', async ({ page }) => {
    await serveList(page)
    const seen = new Set<string>()
    await page.route(IMAGES, (r) => {
      seen.add(r.request().url())
      return r.fulfill({ status: 200, contentType: 'image/png', body: PNG })
    })
    await visit(page, '/infografis')
    await expect(page.getByTestId('infografis-grid').locator('> li')).toHaveCount(24)
    await page.mouse.wheel(0, 20000)
    await expect.poll(() => seen.size).toBeGreaterThan(0) // the lazy images in view have been asked for
    await page.waitForLoadState('networkidle')
    expect(seen.size).toBeLessThanOrEqual(24)
    expect([...seen].every((u) => /id(3[7-9]|[4-6]\d)\//.test(u))).toBe(true) // ids 37 to 60 are the newest 24
    await page.getByRole('button', { name: 'Muat lagi' }).click()
    await expect(page.getByTestId('infografis-grid').locator('> li')).toHaveCount(48)
    await expect(page.getByText('Menampilkan 48 dari 60 infografis')).toBeVisible()
  })

  test('search narrows the list', async ({ page }) => {
    await serveList(page)
    await visit(page, '/infografis')
    await page.getByLabel('Cari judul').fill('nomor 5')
    await expect(page.getByText('Menampilkan 11 dari 11 infografis')).toBeVisible() // 5, 50 to 59
  })

  for (const locale of ['id', 'en'] as const) {
    test(`axe: the grid and the open viewer pass (${locale})`, async ({ page }) => {
      await serveList(page)
      await page.route(IMAGES, (r) => r.abort('failed'))
      await visit(page, '/infografis', { locale })
      await expect(page.getByTestId('infografis-grid').locator('> li')).toHaveCount(24)
      await expectNoA11yViolations(page)
      await page.locator('button[data-id="50"]').click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await expectNoA11yViolations(page)
    })
  }

  test('the list request fails: an alert with a retry that brings the cards back', async ({ page }) => {
    await page.route(LIST, (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{"status":"error","error":"x"}' }))
    await visit(page, '/infografis')
    await expect(page.getByRole('alert')).toContainText('Data gagal dimuat')
    await page.unroute(LIST)
    await serveList(page)
    await page.getByRole('button', { name: 'Coba lagi' }).click()
    await expect(page.getByTestId('infografis-grid').locator('> li')).toHaveCount(24)
  })
})
