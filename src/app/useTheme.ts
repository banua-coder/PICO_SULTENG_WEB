import { ref } from 'vue'

export type ThemeChoice = 'system' | 'light' | 'dark'
export const THEME_KEY = 'pico-theme'

const ORDER: ThemeChoice[] = ['system', 'light', 'dark']
const isChoice = (v: unknown): v is ThemeChoice => v === 'light' || v === 'dark' || v === 'system'

// Module singleton. It always starts as 'system' so the prerendered HTML and the first client
// render agree. The inline script in index.html has already set data-theme before paint, and
// init() (called once after mount) brings this ref in line with it.
const theme = ref<ThemeChoice>('system')

function apply(t: ThemeChoice) {
  if (typeof document === 'undefined') return
  if (t === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.dataset.theme = t
}

function store(t: ThemeChoice) {
  try {
    if (t === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, t)
  } catch {
    // storage can be blocked (private mode); the theme still applies for this visit
  }
}

function set(t: ThemeChoice) {
  theme.value = t
  apply(t)
  store(t)
}

function init() {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(THEME_KEY)
  } catch {
    // ignore
  }
  if (isChoice(saved) && saved !== 'system') set(saved)
}

const cycle = () => set(ORDER[(ORDER.indexOf(theme.value) + 1) % ORDER.length]!)

export function useTheme() {
  return { theme, set, cycle, init }
}

/** For tests only. */
export function _resetTheme() {
  theme.value = 'system'
}
