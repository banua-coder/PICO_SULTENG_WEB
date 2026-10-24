/** Keyboard model of the plot: arrows move one date, Page Up and Page Down 30, Home and End the ends. Null for other keys. */
export function moveFocus(key: string, index: number, count: number): number | null {
  const last = count - 1
  const to = (i: number) => Math.min(last, Math.max(0, i))
  switch (key) {
    case 'ArrowLeft':
      return to(index - 1)
    case 'ArrowRight':
      return to(index + 1)
    case 'PageUp':
      return to(index - 30)
    case 'PageDown':
      return to(index + 30)
    case 'Home':
      return 0
    case 'End':
      return last
    default:
      return null
  }
}
