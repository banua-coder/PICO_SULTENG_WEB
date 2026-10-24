/// <reference types="vite/client" />

/** The day of the build (YYYY-MM-DD). The home page picks its 3 hospitals from it, so the prerender and the first client render agree. */
declare const __BUILD_DAY__: string
/** true only in a build made with VITE_MAP_BANDS=1: the band strips are in the bundle then, never otherwise (check:dist) */
declare const __MAP_BANDS__: boolean

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_LIVE_MODE?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_KIT?: string
  /** '1' lets the map use a kabupaten band pattern as the identity fill of the selected area (after the cultural review). */
  readonly VITE_MAP_BANDS?: string
  /** 'api' reads kabupaten latest from /regencies?include_latest_case=true. Default: the build-time snapshot. */
  readonly VITE_REGENCY_LATEST?: string
}
