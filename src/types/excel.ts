export interface ExcelRow {
  id: number
  date: string
  region: string
  product: string
  category: string
  sales: number
  units: number
  profitMargin: number
  salesRep: string
  status: '已交付' | '进行中' | '退款'
}

export type DynamicExcelRow = Record<string, any>

export interface ExcelFileMeta {
  fileName: string
  sheetName: string
  rowCount: number
  columnCount: number
  fileSize?: number
}

export interface ParsedExcelResult {
  fileName: string
  sheetName: string
  sheetNames: string[]
  columns: string[]
  data: Record<string, any>[]
  rowCount: number
  columnCount: number
}

export interface MetricCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  tip: string
}

export interface AiInsight {
  id: string
  category: '洞察' | '异常' | '建议' | '趋势'
  title: string
  content: string
  importance: 'high' | 'medium' | 'low'
  tags: string[]
}

export interface QuickPrompt {
  id: number
  icon: string
  label: string
  query: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  text: string
  timestamp: string
}

export interface TrendChartData {
  dates: string[]
  sales: number[]
  orders: number[]
  dateRangeText?: string
}

export interface RegionShareData {
  name: string
  value: number
}

