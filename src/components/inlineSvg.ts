/**
 * Prepare a brand illustration for inline use next to a text caption: decorative (no role, no title or desc),
 * sized by CSS, and with ids made unique so four of them on one page do not share a `clipPath` or `aria-labelledby` id.
 */
export function inlineSvg(raw: string, uid: string): string {
  return raw
    .replace(/<title[^>]*>[\s\S]*?<\/title>/g, '')
    .replace(/<desc[^>]*>[\s\S]*?<\/desc>/g, '')
    .replace(/\s(?:role|aria-labelledby|width|height)="[^"]*"/g, (m, offset: number) => (offset < raw.indexOf('>') ? '' : m))
    .replace(/\sid="([^"]+)"/g, (_, id: string) => ` id="${uid}-${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${uid}-${id})`)
    .replace(/(href|xlink:href)="#([^"]+)"/g, (_, a: string, id: string) => `${a}="#${uid}-${id}"`)
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
}
