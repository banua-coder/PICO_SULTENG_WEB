/** Public origin of the site, no trailing slash. Used by head tags, the sitemap and the dist checks. */
export const siteUrl = (): string => {
  const fromNode = typeof process !== 'undefined' ? process.env?.VITE_SITE_URL : undefined
  return (import.meta.env?.VITE_SITE_URL || fromNode || 'https://pico.banuacoder.com').replace(/\/+$/, '')
}
