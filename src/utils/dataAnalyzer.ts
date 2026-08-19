import type {
  DynamicExcelRow,
  TrendChartData,
  RegionShareData,
  DatasetAnalysisContext,
  DimensionRanking,
  MetricCard,
  AiInsight
} from '../types/excel'

/**
 * Common field aliases for heuristic matching based on real Excel columns
 */
const ORDER_ID_CANDIDATES = ['orderId', 'order_id', '订单编号', '订单ID', '编号', 'id', 'ID', '序号', '__rowId']
const DATE_CANDIDATES = ['date', '日期', '订单日期', '成交时间', '时间', '下单日期', '销售日期', 'Date', 'DATE']
const CUSTOMER_CANDIDATES = ['customer', '客户名称', '客户', '客户姓名', '公司名称', '购买客户', 'Customer', 'CUSTOMER']
const REGION_CANDIDATES = ['region', '地区', '区域', '省份', '城市', '省区', '大区', 'Region', 'REGION']
const CATEGORY_CANDIDATES = ['category', '产品类别', '类别', '品类', '产品分类', '分类', 'Category', 'CATEGORY']
const PRODUCT_CANDIDATES = ['product', '产品名称', '产品', '商品', '商品名称', 'Product', 'PRODUCT']
const UNITS_CANDIDATES = ['units', '销售数量', '销量', '数量', '订单量', '件数', '销量 (件)', '销量(件)', 'Units', 'UNITS', 'Quantity', 'quantity']
const UNIT_PRICE_CANDIDATES = ['unitPrice', 'price', '单价', '产品单价', '商品单价', '售价', 'Price', 'PRICE']
const SALES_CANDIDATES = ['sales', '销售金额', '销售额', '金额', '销售额 (元)', '销售额(元)', '收入', '实付金额', '总额', '总销售额', 'Sales', 'SALES', 'amount', 'Amount']
const SALES_REP_CANDIDATES = ['salesRep', '销售人员', '销售代表', '负责人', '业务员', '销售顾问', 'SalesRep', 'SALES_REP']

/**
 * Helper to find the matching column key in a row
 */
function findKey(row: Record<string, any>, candidates: string[]): string | null {
  if (!row) return null
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
 * Parse date into timestamp for proper chronological sorting
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

  const sortedItems = Array.from(dateMap.values()).sort((a, b) => {
    if (a.timestamp && b.timestamp && a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }
    return a.rawDate.localeCompare(b.rawDate)
  })

  const dates = sortedItems.map(item => item.displayDate)
  const sales = sortedItems.map(item => Math.round(item.totalSales * 100) / 100)
  const orders = sortedItems.map(item => item.totalOrders)

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

  return Array.from(regionMap.entries())
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Dimension aggregation helper
 */
function aggregateDimension(
  data: DynamicExcelRow[],
  candidates: string[],
  salesKey: string | null,
  unitsKey: string | null,
  totalSales: number
): DimensionRanking[] {
  if (data.length === 0) return []
  const sample = data[0]
  const dimKey = findKey(sample, candidates)
  if (!dimKey) return []

  const map = new Map<string, { totalSales: number; totalUnits: number; orderCount: number }>()

  data.forEach((row, index) => {
    const rawDim = row[dimKey]
    const name = (rawDim !== undefined && rawDim !== null && String(rawDim).trim() !== '')
      ? String(rawDim).trim()
      : `未命名 (${index + 1})`

    const rawSales = salesKey ? Number(row[salesKey]) : 0
    const salesNum = isNaN(rawSales) ? 0 : rawSales

    const rawUnits = unitsKey ? Number(row[unitsKey]) : 1
    const unitsNum = (isNaN(rawUnits) || rawUnits <= 0) ? 1 : rawUnits

    if (!map.has(name)) {
      map.set(name, { totalSales: salesNum, totalUnits: unitsNum, orderCount: 1 })
    } else {
      const item = map.get(name)!
      item.totalSales += salesNum
      item.totalUnits += unitsNum
      item.orderCount += 1
    }
  })

  return Array.from(map.entries())
    .map(([name, stat]) => ({
      name,
      totalSales: Math.round(stat.totalSales * 100) / 100,
      totalUnits: stat.totalUnits,
      orderCount: stat.orderCount,
      percentage: totalSales > 0 ? Math.round((stat.totalSales / totalSales) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
}

/**
 * Build structured dataset analysis context strictly from actual columns
 */
export function buildDatasetAnalysisContext(data: DynamicExcelRow[]): DatasetAnalysisContext {
  const emptyContext: DatasetAnalysisContext = {
    overview: {
      totalSales: 0,
      totalOrders: 0,
      totalUnits: 0,
      averageOrderValue: 0,
      averageUnitPrice: 0
    },
    dateTrend: {
      startDate: '',
      endDate: '',
      totalDays: 0,
      activeSalesDays: 0,
      peakDate: '',
      peakDateSales: 0,
      dailyAverageSales: 0
    },
    dimensions: {
      byRegion: [],
      byCategory: [],
      byProduct: [],
      bySalesRep: [],
      byCustomer: []
    },
    highlights: {
      topRegion: null,
      topCategory: null,
      topProduct: null,
      topSalesRep: null,
      topCustomer: null,
      largestSingleOrder: null
    }
  }

  if (!data || data.length === 0) {
    return emptyContext
  }

  const sample = data[0]
  const orderIdKey = findKey(sample, ORDER_ID_CANDIDATES)
  const dateKey = findKey(sample, DATE_CANDIDATES)
  const customerKey = findKey(sample, CUSTOMER_CANDIDATES)
  const salesKey = findKey(sample, SALES_CANDIDATES)
  const unitsKey = findKey(sample, UNITS_CANDIDATES)
  const unitPriceKey = findKey(sample, UNIT_PRICE_CANDIDATES)
  const productKey = findKey(sample, PRODUCT_CANDIDATES)
  const salesRepKey = findKey(sample, SALES_REP_CANDIDATES)

  // 1. Calculate overview metrics
  let totalSales = 0
  let totalUnits = 0
  let largestOrderSales = -1
  let largestOrderRecord: DatasetAnalysisContext['highlights']['largestSingleOrder'] = null

  // Date tracking for trend summary
  const dateSalesMap = new Map<string, { totalSales: number; timestamp: number }>()

  data.forEach((row, index) => {
    let salesNum = 0
    if (salesKey) {
      const raw = Number(row[salesKey])
      salesNum = isNaN(raw) ? 0 : raw
    } else if (unitPriceKey && unitsKey) {
      const price = Number(row[unitPriceKey])
      const qty = Number(row[unitsKey])
      if (!isNaN(price) && !isNaN(qty)) {
        salesNum = price * qty
      }
    }
    totalSales += salesNum

    const rawUnits = unitsKey ? Number(row[unitsKey]) : 1
    const unitsNum = (isNaN(rawUnits) || rawUnits <= 0) ? 1 : rawUnits
    totalUnits += unitsNum

    // Check largest order
    if (salesNum > largestOrderSales) {
      largestOrderSales = salesNum
      largestOrderRecord = {
        orderId: orderIdKey ? String(row[orderIdKey]) : `#${index + 1}`,
        customerName: customerKey ? String(row[customerKey]) : undefined,
        productName: productKey ? String(row[productKey]) : undefined,
        salesRep: salesRepKey ? String(row[salesRepKey]) : undefined,
        salesAmount: salesNum,
        date: dateKey ? String(row[dateKey]) : undefined
      }
    }

    // Group by date for summary
    if (dateKey && row[dateKey]) {
      const dStr = String(row[dateKey]).trim()
      const ts = parseTimestamp(dStr)
      if (!dateSalesMap.has(dStr)) {
        dateSalesMap.set(dStr, { totalSales: salesNum, timestamp: ts })
      } else {
        dateSalesMap.get(dStr)!.totalSales += salesNum
      }
    }
  })

  const totalOrders = data.length
  totalSales = Math.round(totalSales * 100) / 100
  const averageOrderValue = totalOrders > 0 ? Math.round((totalSales / totalOrders) * 100) / 100 : 0
  const averageUnitPrice = totalUnits > 0 ? Math.round((totalSales / totalUnits) * 100) / 100 : 0

  // 2. Date trend summary
  const sortedDates = Array.from(dateSalesMap.entries()).sort((a, b) => {
    if (a[1].timestamp && b[1].timestamp && a[1].timestamp !== b[1].timestamp) {
      return a[1].timestamp - b[1].timestamp
    }
    return a[0].localeCompare(b[0])
  })

  let startDate = ''
  let endDate = ''
  let peakDate = ''
  let peakDateSales = 0
  const activeSalesDays = sortedDates.length

  if (sortedDates.length > 0) {
    startDate = sortedDates[0][0]
    endDate = sortedDates[sortedDates.length - 1][0]
    sortedDates.forEach(([dStr, stat]) => {
      if (stat.totalSales > peakDateSales) {
        peakDateSales = stat.totalSales
        peakDate = dStr
      }
    })
  }

  const dailyAverageSales = activeSalesDays > 0 ? Math.round((totalSales / activeSalesDays) * 100) / 100 : 0

  // 3. Dimensional Breakdown
  const byRegion = aggregateDimension(data, REGION_CANDIDATES, salesKey, unitsKey, totalSales)
  const byCategory = aggregateDimension(data, CATEGORY_CANDIDATES, salesKey, unitsKey, totalSales)
  const byProduct = aggregateDimension(data, PRODUCT_CANDIDATES, salesKey, unitsKey, totalSales)
  const bySalesRep = aggregateDimension(data, SALES_REP_CANDIDATES, salesKey, unitsKey, totalSales)
  const byCustomer = aggregateDimension(data, CUSTOMER_CANDIDATES, salesKey, unitsKey, totalSales)

  return {
    overview: {
      totalSales,
      totalOrders,
      totalUnits,
      averageOrderValue,
      averageUnitPrice
    },
    dateTrend: {
      startDate,
      endDate,
      totalDays: activeSalesDays,
      activeSalesDays,
      peakDate,
      peakDateSales: Math.round(peakDateSales * 100) / 100,
      dailyAverageSales
    },
    dimensions: {
      byRegion,
      byCategory,
      byProduct,
      bySalesRep,
      byCustomer
    },
    highlights: {
      topRegion: byRegion[0] || null,
      topCategory: byCategory[0] || null,
      topProduct: byProduct[0] || null,
      topSalesRep: bySalesRep[0] || null,
      topCustomer: byCustomer[0] || null,
      largestSingleOrder: largestOrderRecord
    }
  }
}

/**
 * Generate 4 KPI Metric Cards derived strictly from computed facts
 */
export function generateMetricCardsFromContext(context: DatasetAnalysisContext): MetricCard[] {
  const { overview, dateTrend, highlights } = context

  if (overview.totalOrders === 0) {
    return [
      { title: '总销售额 (Sales)', value: '¥ 0', change: '0 笔订单', trend: 'neutral', tip: '暂无数据' },
      { title: '笔均客单价 (AOV)', value: '¥ 0', change: '0 件/单', trend: 'neutral', tip: '暂无数据' },
      { title: '总销售件数 (Volume)', value: '0 件', change: '累计数量', trend: 'neutral', tip: '暂无数据' },
      { title: '销售冠军 (Top Rep)', value: '暂无', change: '0%', trend: 'neutral', tip: '暂无数据' }
    ]
  }

  const salesFormatted = `¥ ${Math.round(overview.totalSales).toLocaleString()}`
  const aovFormatted = `¥ ${Math.round(overview.averageOrderValue).toLocaleString()}`
  const avgUnitsPerOrder = (overview.totalUnits / overview.totalOrders).toFixed(1)

  return [
    {
      title: '总销售额 (Sales)',
      value: salesFormatted,
      change: `${overview.totalOrders} 笔订单`,
      trend: 'up',
      tip: dateTrend.activeSalesDays > 0
        ? `跨度 ${dateTrend.activeSalesDays} 个销售日 · 日均 ¥${Math.round(dateTrend.dailyAverageSales).toLocaleString()}`
        : `共 ${overview.totalOrders} 笔有效订单金额汇总`
    },
    {
      title: '笔均客单价 (AOV)',
      value: aovFormatted,
      change: `单均 ${avgUnitsPerOrder} 件商品`,
      trend: 'neutral',
      tip: `总销售额 / ${overview.totalOrders} 笔订单`
    },
    {
      title: '总销售件数 (Volume)',
      value: `${overview.totalUnits.toLocaleString()} 件`,
      change: '商品数量之和',
      trend: 'up',
      tip: `覆盖 ${overview.totalOrders} 笔订单 · 单件均价约 ¥${Math.round(overview.averageUnitPrice).toLocaleString()}`
    },
    {
      title: '销售冠军 (Top Rep)',
      value: highlights.topSalesRep ? highlights.topSalesRep.name : '团队协同',
      change: highlights.topSalesRep ? `贡献 ${highlights.topSalesRep.percentage}%` : '全员产出',
      trend: 'up',
      tip: highlights.topSalesRep
        ? `销售额 ¥${Math.round(highlights.topSalesRep.totalSales).toLocaleString()} · 签单 ${highlights.topSalesRep.orderCount} 笔 · 销量 ${highlights.topSalesRep.totalUnits} 件`
        : '团队整体创收'
    }
  ]
}

/**
 * Generate fact-based analytical insight cards derived strictly from dataset context
 */
export function generateInsightsFromContext(context: DatasetAnalysisContext): AiInsight[] {
  const { overview, dimensions, highlights } = context

  if (overview.totalOrders === 0) {
    return []
  }

  const insights: AiInsight[] = []

  // 1. Primary Region Insight
  if (highlights.topRegion) {
    const topReg = highlights.topRegion
    const top3Ratio = dimensions.byRegion.slice(0, 3).reduce((acc, curr) => acc + curr.percentage, 0).toFixed(1)

    insights.push({
      id: 'ins-region',
      category: '洞察',
      importance: 'high',
      title: `${topReg.name}贡献 ${topReg.percentage}% 销售额，位列区域市场第一`,
      content: `在已统计的 ${dimensions.byRegion.length} 个地区中，${topReg.name} 累计销售额达 ¥${Math.round(topReg.totalSales).toLocaleString()}（成交 ${topReg.orderCount} 笔订单 · 销售商品 ${topReg.totalUnits} 件）。前 ${Math.min(3, dimensions.byRegion.length)} 大区域合计贡献 ${top3Ratio}% 销售额，显现出较强的区域集聚效应。`,
      tags: ['主力区域', topReg.name, '区域透视']
    })
  }

  // 2. Core Product Category & Top SKU Trend
  if (highlights.topCategory && highlights.topProduct) {
    const topCat = highlights.topCategory
    const topProd = highlights.topProduct

    insights.push({
      id: 'ins-product',
      category: '趋势',
      importance: 'medium',
      title: `「${topCat.name}」品类领跑，单品「${topProd.name}」创收居首`,
      content: `核心产品类别「${topCat.name}」总销售额达 ¥${Math.round(topCat.totalSales).toLocaleString()}（全盘占比 ${topCat.percentage}%）。明星单品「${topProd.name}」单款创收 ¥${Math.round(topProd.totalSales).toLocaleString()}，累计销售商品 ${topProd.totalUnits} 件（涉及 ${topProd.orderCount} 笔订单）。`,
      tags: ['品类领跑', '畅销单品', topCat.name]
    })
  }

  // 3. Sales Representative Performance Ladder
  if (highlights.topSalesRep) {
    const topRep = highlights.topSalesRep
    const repCount = dimensions.bySalesRep.length
    const avgRepSales = Math.round(overview.totalSales / (repCount || 1))

    insights.push({
      id: 'ins-sales-rep',
      category: '建议',
      importance: 'medium',
      title: `销售团队共 ${repCount} 位代表，冠军「${topRep.name}」贡献 ${topRep.percentage}% 业绩`,
      content: `销售代表「${topRep.name}」以 ¥${Math.round(topRep.totalSales).toLocaleString()} 的业绩领跑团队（累计签单 ${topRep.orderCount} 笔订单 · 销售商品 ${topRep.totalUnits} 件）。团队人均创收约 ¥${avgRepSales.toLocaleString()}，建议提炼头部代表的成单经验向团队推广。`,
      tags: ['业绩梯队', '销售激励', '人均创收']
    })
  }

  // 4. Largest Single Order & Benchmark Customer
  if (highlights.largestSingleOrder && highlights.largestSingleOrder.salesAmount > 0) {
    const bigOrder = highlights.largestSingleOrder
    const orderRatio = overview.totalSales > 0 ? ((bigOrder.salesAmount / overview.totalSales) * 100).toFixed(1) : '0'

    insights.push({
      id: 'ins-big-order',
      category: '洞察',
      importance: 'high',
      title: `捕获单笔峰值大单 ¥${Math.round(bigOrder.salesAmount).toLocaleString()}${bigOrder.customerName ? `（客户：${bigOrder.customerName}）` : ''}`,
      content: `大单明细追踪：${bigOrder.date ? `于 ${bigOrder.date} ` : ''}由销售代表「${bigOrder.salesRep || '团队'}」签单${bigOrder.customerName ? `给「${bigOrder.customerName}」` : ''}，采购产品「${bigOrder.productName || '产品'}」，单笔金额占全盘总销售额的 ${orderRatio}%。`,
      tags: ['峰值大单', bigOrder.customerName || '标杆客群', '重点合同']
    })
  }

  return insights
}
