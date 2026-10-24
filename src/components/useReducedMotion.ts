import { onBeforeUnmount, onMounted, ref } from 'vue'

/** True when the visitor asked for reduced motion. False during prerender, then the real value after mount. */
export function useReducedMotion() {
  const reduced = ref(false)
  let mq: MediaQueryList | undefined
  const update = () => (reduced.value = !!mq?.matches)
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mq.addEventListener('change', update)
  })
  onBeforeUnmount(() => mq?.removeEventListener('change', update))
  return reduced
}
