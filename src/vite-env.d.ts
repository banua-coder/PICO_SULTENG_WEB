/// <reference types="vite/client" />

/** The day of the build (YYYY-MM-DD). The home page picks its 3 hospitals from it, so the prerender and the first client render agree. */
declare const __BUILD_DAY__: string

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_LIVE_MODE?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_KIT?: string
  /** 'api' reads kabupaten latest from /regencies?include_latest_case=true. Default: the build-time snapshot. */
  readonly VITE_REGENCY_LATEST?: string
}
