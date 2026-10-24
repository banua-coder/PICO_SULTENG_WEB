import type { Cell } from '@/app/csv'

/**
 * XLSX file of the same rows. SheetJS is imported here, on first use, so it is its own lazy chunk and never part of a page's
 * initial JS (ADR-0100 amendment). Numbers stay numbers and null stays an empty cell.
 */
export async function toXlsx(sheet: string, header: string[], rows: Cell[][]): Promise<Blob> {
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheet.slice(0, 31))
  const bytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx', compression: true }) as ArrayBuffer
  return new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
