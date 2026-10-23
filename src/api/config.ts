export const DEFAULT_API_BASE_URL = 'https://pico-api.banuacoder.com/api/v1'
export const TIMEOUT_MS = 15_000
export const RETRY_DELAY_MS = 1_000
export const LIVE_STALE_MS = 15 * 60_000

// Node scripts (snapshot, downloads, fixtures) have no import.meta.env: they read the process environment instead.
const fromNode = () => (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL : undefined)
export const apiBaseUrl = (): string => (import.meta.env?.VITE_API_BASE_URL || fromNode() || DEFAULT_API_BASE_URL).replace(/\/+$/, '')
export const isLiveMode = (): boolean => !!import.meta.env?.VITE_LIVE_MODE
