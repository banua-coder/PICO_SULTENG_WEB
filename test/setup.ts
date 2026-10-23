import { beforeEach, vi } from 'vitest'

// Unit tests never reach the real API or run the real Lottie player (happy-dom has no canvas).
vi.mock('lottie-web/build/player/lottie_light', () => ({ default: { loadAnimation: () => ({ destroy: () => undefined }) } }))

beforeEach(() => {
  if (process.env.LIVE_API) return // the live acceptance test talks to the real API on purpose
  vi.stubGlobal('fetch', async () => new Response('{"status":"error","error":"offline in tests"}', { status: 503 }))
})
