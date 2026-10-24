// The Lottie player, loaded only when a moment is about to play (own chunk, ~47 kB gzip: lottie-web's light SVG build). The light build has no
// expressions engine, so it needs no eval or new Function: the CSP (script-src 'self') holds. The animation JSON is a same-origin file.
import type { AnimationItem } from 'lottie-web'

export type PlayOptions = { container: HTMLElement; name: string; dark: boolean; loop: boolean; onDone?: () => void }

export async function play({ container, name, dark, loop, onDone }: PlayOptions): Promise<AnimationItem> {
  const [{ default: lottie }, res, { recolorDark }] = await Promise.all([
    import('lottie-web/build/player/lottie_light.min.js'),
    fetch(`/lottie/${name === 'logo-reveal' && dark ? 'logo-reveal-dark' : name}.json`),
    import('./recolor'),
  ])
  if (!res.ok) throw new Error(`lottie ${name}: ${res.status}`)
  const data = await res.json()
  const anim = lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop,
    autoplay: true,
    animationData: dark && name !== 'logo-reveal' ? recolorDark(data) : data,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet', progressiveLoad: false },
  })
  if (!loop && onDone) anim.addEventListener('complete', onDone)
  return anim
}
