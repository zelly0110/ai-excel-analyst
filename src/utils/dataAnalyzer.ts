import type { DynamicExcelRow, TrendChartData, RegionShareData } from '../types/excel'

/**
 * Common field aliases for heuristic matching
 */
const DATE_CANDIDATES = ['date', '日期', '成交时间', '时间', '下单日期', '销售日期', '订单日期', 'Date', 'DATE']
const SALES_CANDIDATES = ['sales', '销售额', '金额', '销售额 (元)', '销售额(元)', '销售金额', '收入', '实付金额', '总额', '总销售额', 'Sales', 'SALES', 'amount', 'Amount']
const REGION_CANDIDATES = ['region', '地区', '区域', '省份', '城市', '省区', '大区', 'Region', 'REGION', 'category', '分类', '类别']
const UNITS_CANDIDATES = ['units', '销量', '数量', '订单量', '件数', '销量 (件)', '销量(件)', 'Units', 'UNITS', 'count', 'Quantity', 'quantity']

/**
 * Helper to find the matching column key in the first row
 */
function findKey(row: Record<string, any>, candidates: string[]): string | null {
  const keys = Object.keys(row)
  // 1. Exact match
  for (const cand of candidates) {
    if (cand in row) return cand
  }
  // 2. Case-insensitive / trimmed match
  for (const cand of candidates) {
    const matched = keys.find(k => k.trim().toLowerCase() === cand.toLowerCase())
    if (matched) return matched
  }
  // 3. Substring match
  for (const cand of candidates) {
    const matched = keys.find(k => k.toLowerCase().includes(cand.toLowerCase()))
    if (matched) return matched
  }
  return null
}

/**
 * Format date string for chart X-axis display (e.g. "8-01" or "2026-08-01")
 */
function formatChartDate(rawDate: any): string {
  if (rawDate === undefined || rawDate === null || rawDate === '') return '未知日期'
  const str = String(rawDate).trim()

  // Match YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (ymdMatch) {
    const [, , m, d] = ymdMatch
    return `${Number(m)}-${d.padStart(2, '0')}`
  }

  // Match MM-DD or MM/DD
  const mdMatch = str.match(/^(\d{1,2})[-/](\d{1,2})$/)
  if (mdMatch) {
    const [, m, d] = mdMatch
    return `${Number(m)}-${d.padStart(2, '0')}`
  }

  return str
}

/**
 * Parse date into timestamp for proper sorting
 */
function parseTimestamp(rawDate: any): number {
  if (!rawDate) return 0
  const d = new Date(String(rawDate))
  const ts = d.getTime()
  return isNaN(ts) ? 0 : ts
}

/**
 * Analyze sales trend and order volume grouped by date
 */
export function analyzeSalesTrend(data: DynamicExcelRow[]): TrendChartData {
  if (!data || data.length === 0) {
    return { dates: [], sales: [], orders: [], dateRangeText: '' }
  }

  const sample = data[0]
  const dateKey = findKey(sample, DATE_CANDIDATES)
  const salesKey = findKey(sample, SALES_CANDIDATES)
  const unitsKey = findKey(sample, UNITS_CANDIDATES)

  // Map to store grouped statistics: { [rawDateKey]: { displayDate, rawDate, totalSales, totalOrders, timestamp } }
  const dateMap = new Map<string, { displayDate: string; rawDate: string; totalSales: number; totalOrders: number; timestamp: number }>()

  data.forEach((row, index) => {
    const rawDateVal = dateKey ? row[dateKey] : `条目 ${index + 1}`
    const rawDateStr = String(rawDateVal || `条目 ${index + 1}`).trim()
    const displayDate = formatChartDate(rawDateStr)
    const timestamp = parseTimestamp(rawDateStr)

    const rawSales = salesKey ? Number(row[salesKey]) : 0
    const salesNum = isNaN(rawSales) ? 0 : rawSales

    let unitsNum = 1
    if (unitsKey) {
      const parsedUnits = Number(row[unitsKey])
      if (!isNaN(parsedUnits) && parsedUnits > 0) {
        unitsNum = parsedUnits
      }
    }

    if (!dateMap.has(rawDateStr)) {
      dateMap.set(rawDateStr, {
        displayDate,
        rawDate: rawDateStr,
        totalSales: salesNum,
        totalOrders: unitsNum,
        timestamp: timestamp || index
      })
    } else {
      const item = dateMap.get(rawDateStr)!
      item.totalSales += salesNum
      item.totalOrders += unitsNum
    }
  })

  // Sort chronologically
  const sortedItems = Array.from(dateMap.values()).sort((a, b) => {
    if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }
    return a.rawDate.localeCompare(b.rawDate)
  })

  const dates = sortedItems.map(item => item.displayDate)
  const sales = sortedItems.map(item => Math.round(item.totalSales * 100) / 100)
  const orders = sortedItems.map(item => item.totalOrders)

  // Generate date range description
  let dateRangeText = ''
  if (dates.length > 0) {
    const firstDate = sortedItems[0].rawDate
    const lastDate = sortedItems[sortedItems.length - 1].rawDate
    if (firstDate === lastDate) {
      dateRangeText = firstDate
    } else {
      dateRangeText = `${firstDate} 至 ${lastDate}`
    }
  }

  return {
    dates,
    sales,
    orders,
    dateRangeText
  }
}

/**
 * Analyze sales amount contribution grouped by region/category
 */
export function analyzeRegionShare(data: DynamicExcelRow[]): RegionShareData[] {
  if (!data || data.length === 0) {
    return []
  }

  const sample = data[0]
  const regionKey = findKey(sample, REGION_CANDIDATES)
  const salesKey = findKey(sample, SALES_CANDIDATES)

  const regionMap = new Map<string, number>()

  data.forEach((row, index) => {
    const regionName = regionKey ? String(row[regionKey] || '其他').trim() : `分类 ${index + 1}`
    const rawSales = salesKey ? Number(row[salesKey]) : 0
    const salesNum = isNaN(rawSales) ? 0 : rawSales

    regionMap.set(regionName, (regionMap.get(regionName) || 0) + salesNum)
  })

  // Sort descending by sales value
  const result: RegionShareData[] = Array.from(regionMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }))
    .sort((a, b) => b.value - a.value)

  return result
}
