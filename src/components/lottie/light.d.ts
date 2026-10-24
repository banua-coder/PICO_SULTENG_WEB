// lottie-web ships types for the full build only; the light build has the same API.
declare module 'lottie-web/build/player/lottie_light.min.js' {
  import type { LottiePlayer } from 'lottie-web'
  const lottie: LottiePlayer
  export default lottie
}
