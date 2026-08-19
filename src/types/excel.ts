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

export interface DimensionRanking {
  name: string
  totalSales: number
  totalUnits: number
  orderCount: number
  percentage: number
}

export interface DateTrendSummary {
  startDate: string
  endDate: string
  totalDays: number
  activeSalesDays: number
  peakDate: string
  peakDateSales: number
  dailyAverageSales: number
}

export interface DatasetAnalysisContext {
  overview: {
    totalSales: number
    totalOrders: number
    totalUnits: number
    averageOrderValue: number
    averageUnitPrice: number
  }
  dateTrend: DateTrendSummary
  dimensions: {
    byRegion: DimensionRanking[]
    byCategory: DimensionRanking[]
    byProduct: DimensionRanking[]
    bySalesRep: DimensionRanking[]
    byCustomer: DimensionRanking[]
  }
  highlights: {
    topRegion: DimensionRanking | null
    topCategory: DimensionRanking | null
    topProduct: DimensionRanking | null
    topSalesRep: DimensionRanking | null
    topCustomer: DimensionRanking | null
    largestSingleOrder: {
      orderId?: string
      customerName?: string
      productName?: string
      salesRep?: string
      salesAmount: number
      date?: string
    } | null
  }
}


