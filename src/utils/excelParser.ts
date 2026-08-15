import * as XLSX from 'xlsx'
import type { ParsedExcelResult } from '../types/excel'

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse an uploaded Excel file (.xlsx, .xls, .csv) and extract JSON data from the first sheet.
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true
  })

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('未在 Excel 文件中检测到有效的工作表 (Sheet)')
  }

  const sheetNames = workbook.SheetNames
  const firstSheetName = sheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]

  // Get raw JSON array with default empty string for empty cells
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: ''
  })

  // Extract columns in original order
  let columns: string[] = []
  const headerRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
    header: 1,
    defval: ''
  })

  if (headerRows.length > 0 && Array.isArray(headerRows[0])) {
    columns = headerRows[0]
      .map((col: any) => (col !== undefined && col !== null ? String(col).trim() : ''))
      .filter((col: string) => col.length > 0)
  }

  // If header extraction didn't yield columns, fallback to keys of first data item
  if (columns.length === 0 && rawData.length > 0) {
    columns = Object.keys(rawData[0])
  }

  // Format any Date objects in rows to readable strings
  const formattedData = rawData.map((row, index) => {
    const formattedRow: Record<string, any> = {}

    // Ensure there is an id or index if needed
    for (const key of Object.keys(row)) {
      const val = row[key]
      if (val instanceof Date) {
        // Adjust for timezone offset if needed, or format directly
        formattedRow[key] = formatDate(val)
      } else {
        formattedRow[key] = val
      }
    }

    // Add a virtual __rowId for table keying if no unique id exists
    if (formattedRow.id === undefined && formattedRow['序号'] === undefined) {
      formattedRow.__rowId = index + 1
    }

    return formattedRow
  })

  return {
    fileName: file.name,
    sheetName: firstSheetName,
    sheetNames,
    columns,
    data: formattedData,
    rowCount: formattedData.length,
    columnCount: columns.length
  }
}
