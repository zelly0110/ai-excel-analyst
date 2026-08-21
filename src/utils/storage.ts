import type { DynamicExcelRow, ExcelFileMeta } from '../types/excel'

const STORAGE_KEY = 'ai_excel_analyst_dataset_v1'

export interface PersistedExcelDataset {
  data: DynamicExcelRow[]
  columns: string[]
  meta: ExcelFileMeta | null
  isDemo: boolean
  savedAt: number
}

/**
 * Save current Excel data, columns, metadata, and demo state to localStorage
 */
export function saveExcelData(
  data: DynamicExcelRow[],
  columns: string[] = [],
  meta: ExcelFileMeta | null = null,
  isDemo: boolean = false
): boolean {
  try {
    if (!data || data.length === 0) {
      clearExcelData()
      return true
    }
    const payload: PersistedExcelDataset = {
      data,
      columns,
      meta,
      isDemo: !!isDemo,
      savedAt: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch (error) {
    console.warn('Failed to save Excel dataset to localStorage:', error)
    return false
  }
}

/**
 * Load persisted Excel dataset from localStorage
 */
export function loadExcelData(): PersistedExcelDataset | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedExcelDataset
    if (parsed && Array.isArray(parsed.data) && parsed.data.length > 0) {
      return parsed
    }
    return null
  } catch (error) {
    console.warn('Failed to load Excel dataset from localStorage:', error)
    return null
  }
}

/**
 * Clear persisted Excel dataset from localStorage
 */
export function clearExcelData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear Excel dataset from localStorage:', error)
  }
}
