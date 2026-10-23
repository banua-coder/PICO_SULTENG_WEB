export const DEFAULT_API_BASE_URL = 'https://pico-api.banuacoder.com/api/v1'
export const TIMEOUT_MS = 15_000
export const RETRY_DELAY_MS = 1_000
export const LIVE_STALE_MS = 15 * 60_000

export const apiBaseUrl = (): string => (import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
export const isLiveMode = (): boolean => !!import.meta.env?.VITE_LIVE_MODE
