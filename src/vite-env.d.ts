/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_LIVE_MODE?: string
  readonly VITE_SITE_URL?: string
  readonly VITE_KIT?: string
  /** 'api' reads kabupaten latest from /regencies?include_latest_case=true. Default: the build-time snapshot. */
  readonly VITE_REGENCY_LATEST?: string
}
