import { beforeEach, describe, expect, it, vi } from 'vitest'
import { _resetTheme, THEME_KEY, useTheme } from './useTheme'

const html = document.documentElement

beforeEach(() => {
  localStorage.clear()
  html.removeAttribute('data-theme')
  _resetTheme()
})

describe('useTheme', () => {
  it('defaults to system: no data-theme attribute, nothing stored', () => {
    const { theme } = useTheme()
    expect(theme.value).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('set(dark) sets data-theme and stores it', () => {
    const { theme, set } = useTheme()
    set('dark')
    expect(theme.value).toBe('dark')
    expect(html.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_KEY)).toBe('dark')
  })

  it('set(system) removes the attribute and the stored value', () => {
    const { set } = useTheme()
    set('light')
    set('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('init() restores a stored choice', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    const { theme, init } = useTheme()
    expect(theme.value).toBe('system') // SSR and hydration render the same thing
    init()
    expect(theme.value).toBe('dark')
    expect(html.dataset.theme).toBe('dark')
  })

  it('init() ignores a junk stored value', () => {
    localStorage.setItem(THEME_KEY, 'purple')
    const { theme, init } = useTheme()
    init()
    expect(theme.value).toBe('system')
  })

  it('cycle() goes system, light, dark, system', () => {
    const { theme, cycle } = useTheme()
    cycle()
    expect(theme.value).toBe('light')
    cycle()
    expect(theme.value).toBe('dark')
    cycle()
    expect(theme.value).toBe('system')
  })

  it('still works when storage throws (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const { theme, set } = useTheme()
    expect(() => set('dark')).not.toThrow()
    expect(theme.value).toBe('dark')
    spy.mockRestore()
  })
})
