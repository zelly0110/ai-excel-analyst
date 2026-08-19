import type { DatasetAnalysisContext, DynamicExcelRow } from '../types/excel'

/**
 * 6 Strictly supported intent types in Day 5
 */
export type QueryIntentType =
  | 'REGION_SALES'     // 地区销售额
  | 'SALES_REP'        // 销售人员业绩
  | 'PRODUCT_SALES'    // 产品/品类销售额
  | 'MONTHLY_SALES'    // 月度销售额与日期
  | 'LARGEST_ORDER'    // 最大订单
  | 'DATA_OVERVIEW'    // 基础数据概览 (总销售额/订单总数/客单价)
  | 'UNSUPPORTED'      // 不支持或未识别的查询类型

export interface QueryIntent {
  type: QueryIntentType
  entityName?: string
  month?: number
  isRankQuery?: boolean
  rawQuery: string
}

/**
 * Step 1: Intent Recognition (query → intent)
 * Decoupled from calculations and response generation.
 */
export function recognizeQueryIntent(
  query: string,
  context: DatasetAnalysisContext | null | undefined
): QueryIntent {
  const q = query.trim()

  // 1. Largest Single Order Intent
  if (
    q.includes('最大') ||
    q.includes('最高') && (q.includes('订单') || q.includes('单笔') || q.includes('一笔')) ||
    q.includes('哪一笔') ||
    q.includes('大单') ||
    q.includes('单笔最高')
  ) {
    return { type: 'LARGEST_ORDER', rawQuery: q }
  }

  // 2. Monthly Sales & Time Intent
  const monthMatch = q.match(/(\d{1,2})\s*月/) || q.match(/(一|二|三|四|五|六|七|八|九|十|十一|十二)\s*月/)
  if (monthMatch || q.includes('哪天') || q.includes('单日最高') || q.includes('日期') || q.includes('时间')) {
    let monthNum: number | undefined = undefined
    if (monthMatch) {
      const mStr = monthMatch[1]
      const digit = parseInt(mStr, 10)
      if (!isNaN(digit)) {
        monthNum = digit
      } else {
        const cnMonths: Record<string, number> = {
          一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6,
          七: 7, 八: 8, 九: 9, 十: 10, 十一: 11, 十二: 12
        }
        monthNum = cnMonths[mStr]
      }
    }
    return {
      type: 'MONTHLY_SALES',
      month: monthNum,
      rawQuery: q
    }
  }

  // 3. Sales Representative Intent
  const isRepKeyword =
    q.includes('谁') ||
    q.includes('销售员') ||
    q.includes('业务员') ||
    q.includes('销售代表') ||
    q.includes('销售人员') ||
    q.includes('卖得最好') ||
    q.includes('销售冠军') ||
    q.includes('销售榜')

  let matchedRepName: string | undefined = undefined
  if (context && context.dimensions.bySalesRep) {
    for (const rep of context.dimensions.bySalesRep) {
      if (rep.name && q.includes(rep.name)) {
        matchedRepName = rep.name
        break
      }
    }
  }

  if (isRepKeyword || matchedRepName) {
    return {
      type: 'SALES_REP',
      entityName: matchedRepName,
      isRankQuery: isRepKeyword && !matchedRepName,
      rawQuery: q
    }
  }

  // 4. Region Sales Intent
  const isRegionKeyword =
    q.includes('地区') ||
    q.includes('区域') ||
    q.includes('省份') ||
    q.includes('城市') ||
    q.includes('大区')

  let matchedRegionName: string | undefined = undefined
  if (context && context.dimensions.byRegion) {
    for (const reg of context.dimensions.byRegion) {
      if (reg.name && q.includes(reg.name)) {
        matchedRegionName = reg.name
        break
      }
    }
  }

  if (isRegionKeyword || matchedRegionName) {
    return {
      type: 'REGION_SALES',
      entityName: matchedRegionName,
      isRankQuery: isRegionKeyword && !matchedRegionName,
      rawQuery: q
    }
  }

  // 5. Product & Category Intent
  const isProductKeyword =
    q.includes('产品') ||
    q.includes('商品') ||
    q.includes('品类') ||
    q.includes('类别') ||
    q.includes('单品') ||
    q.includes('畅销') ||
    q.includes('热销')

  let matchedProductName: string | undefined = undefined
  if (context) {
    if (context.dimensions.byProduct) {
      for (const prod of context.dimensions.byProduct) {
        if (prod.name && q.includes(prod.name)) {
          matchedProductName = prod.name
          break
        }
      }
    }
    if (!matchedProductName && context.dimensions.byCategory) {
      for (const cat of context.dimensions.byCategory) {
        if (cat.name && q.includes(cat.name)) {
          matchedProductName = cat.name
          break
        }
      }
    }
  }

  if (isProductKeyword || matchedProductName) {
    return {
      type: 'PRODUCT_SALES',
      entityName: matchedProductName,
      isRankQuery: isProductKeyword && !matchedProductName,
      rawQuery: q
    }
  }

  // 6. Data Overview & Total KPIs Intent
  if (
    q.includes('总销售额') ||
    q.includes('总额') ||
    q.includes('总共') ||
    q.includes('一共') ||
    q.includes('订单数') ||
    q.includes('多少单') ||
    q.includes('客单价') ||
    q.includes('平均单价') ||
    q.includes('大盘') ||
    q.includes('概览') ||
    q.includes('汇总')
  ) {
    return { type: 'DATA_OVERVIEW', rawQuery: q }
  }

  // 7. Unsupported Intent Fallback
  return { type: 'UNSUPPORTED', rawQuery: q }
}

/**
 * Step 2 & 3: Handlers for Each Intent (calculation → response)
 */

/**
 * Handler 1: Region Sales Query
 */
function handleRegionSales(intent: QueryIntent, context: DatasetAnalysisContext): string {
  const { dimensions, highlights } = context
  const regions = dimensions.byRegion

  if (!regions || regions.length === 0) {
    return '【地区销售分析】当前数据集中未检测到有效的地区字段数据。'
  }

  // A. Specific region queried (e.g. "华东销售额多少？")
  if (intent.entityName) {
    const target = regions.find(r => r.name.includes(intent.entityName!) || intent.entityName!.includes(r.name))
    if (target) {
      const rankIndex = regions.findIndex(r => r.name === target.name) + 1
      return [
        `【地区销售分析 · ${target.name}】`,
        `• 累计销售额：¥ ${Math.round(target.totalSales).toLocaleString()}`,
        `• 全盘销售额占比：${target.percentage}%`,
        `• 累计成交订单数：${target.orderCount} 笔`,
        `• 累计销售商品数量：${target.totalUnits} 件`,
        `• 区域业绩排名：第 ${rankIndex} 名（共 ${regions.length} 个地区）`
      ].join('\n')
    } else {
      const availableNames = regions.map(r => r.name).join('、')
      return `【地区销售查询】在当前数据集中未找到「${intent.entityName}」地区。当前数据中包含的地区有：${availableNames}。`
    }
  }

  // B. Top region / Ranking query (e.g. "哪个地区销售额最高？")
  const topReg = highlights.topRegion || regions[0]
  const top3 = regions.slice(0, 3)
  const top3Details = top3.map((r, idx) => `${idx + 1}. ${r.name} (¥${Math.round(r.totalSales).toLocaleString()} · 占比 ${r.percentage}%)`).join('\n')

  return [
    `【地区销售排行分析】`,
    `当前数据集中销售额最高的地区是「${topReg.name}」：`,
    `• 地区总销售额：¥ ${Math.round(topReg.totalSales).toLocaleString()}`,
    `• 贡献全盘业绩占比：${topReg.percentage}%`,
    `• 累计成交订单：${topReg.orderCount} 笔（商品总量 ${topReg.totalUnits} 件）`,
    `\n地区销售额前 ${top3.length} 名榜单：`,
    top3Details
  ].join('\n')
}

/**
 * Handler 2: Sales Representative Query
 */
function handleSalesRep(intent: QueryIntent, context: DatasetAnalysisContext): string {
  const { dimensions, highlights, overview } = context
  const reps = dimensions.bySalesRep

  if (!reps || reps.length === 0) {
    return '【销售人员分析】当前数据集中未检测到销售人员字段数据。'
  }

  // A. Specific sales rep queried (e.g. "张伟卖了多少？")
  if (intent.entityName) {
    const target = reps.find(r => r.name.includes(intent.entityName!) || intent.entityName!.includes(r.name))
    if (target) {
      const rankIndex = reps.findIndex(r => r.name === target.name) + 1
      return [
        `【销售人员业绩 · ${target.name}】`,
        `• 个人销售总额：¥ ${Math.round(target.totalSales).toLocaleString()}`,
        `• 业绩贡献占比：${target.percentage}%`,
        `• 成功签单笔数：${target.orderCount} 笔订单`,
        `• 销售商品总量：${target.totalUnits} 件`,
        `• 团队业绩排名：第 ${rankIndex} 名（共 ${reps.length} 位销售人员）`
      ].join('\n')
    } else {
      const availableNames = reps.map(r => r.name).join('、')
      return `【销售人员查询】在当前数据集中未找到销售人员「${intent.entityName}」。当前销售人员名单包含：${availableNames}。`
    }
  }

  // B. Champion / Best seller query (e.g. "谁卖得最好？", "哪个销售员销售额最高？")
  const topRep = highlights.topSalesRep || reps[0]
  const top3 = reps.slice(0, 3)
  const top3Details = top3.map((r, idx) => `${idx + 1}. ${r.name} (¥${Math.round(r.totalSales).toLocaleString()} · 贡献 ${r.percentage}%)`).join('\n')
  const avgRepSales = Math.round(overview.totalSales / (reps.length || 1))

  return [
    `【销售团队业绩排行】`,
    `当前数据集中业绩最好、销售额最高的销售代表是「${topRep.name}」：`,
    `• 个人累计销售额：¥ ${Math.round(topRep.totalSales).toLocaleString()}`,
    `• 贡献全盘总业绩占比：${topRep.percentage}%`,
    `• 成功签单笔数：${topRep.orderCount} 笔订单（销售商品共 ${topRep.totalUnits} 件）`,
    `• 团队人均创收金额：¥ ${avgRepSales.toLocaleString()}`,
    `\n销售业绩前 ${top3.length} 名榜单：`,
    top3Details
  ].join('\n')
}

/**
 * Handler 3: Product & Category Sales Query
 */
function handleProductSales(intent: QueryIntent, context: DatasetAnalysisContext): string {
  const { dimensions, highlights } = context
  const products = dimensions.byProduct
  const categories = dimensions.byCategory

  // A. Specific product or category queried
  if (intent.entityName) {
    const prodTarget = products.find(p => p.name.includes(intent.entityName!) || intent.entityName!.includes(p.name))
    if (prodTarget) {
      const rankIndex = products.findIndex(p => p.name === prodTarget.name) + 1
      return [
        `【单品销售分析 · ${prodTarget.name}】`,
        `• 累计销售金额：¥ ${Math.round(prodTarget.totalSales).toLocaleString()}`,
        `• 销售数量：${prodTarget.totalUnits} 件`,
        `• 涉及订单笔数：${prodTarget.orderCount} 笔`,
        `• 全盘销售额占比：${prodTarget.percentage}%`,
        `• 单品销售额排名：第 ${rankIndex} 名（共 ${products.length} 款商品）`
      ].join('\n')
    }

    const catTarget = categories.find(c => c.name.includes(intent.entityName!) || intent.entityName!.includes(c.name))
    if (catTarget) {
      const rankIndex = categories.findIndex(c => c.name === catTarget.name) + 1
      return [
        `【产品品类分析 · ${catTarget.name}】`,
        `• 品类销售总额：¥ ${Math.round(catTarget.totalSales).toLocaleString()}`,
        `• 品类销售件数：${catTarget.totalUnits} 件`,
        `• 成交订单笔数：${catTarget.orderCount} 笔`,
        `• 全盘销售额占比：${catTarget.percentage}%`,
        `• 品类排名：第 ${rankIndex} 名（共 ${categories.length} 个品类）`
      ].join('\n')
    }
  }

  // B. Top product query (e.g. "哪个产品销售额最高？")
  if (!products || products.length === 0) {
    return '【产品分析】当前数据集中未检测到产品明细字段。'
  }

  const topProd = highlights.topProduct || products[0]
  const topCat = highlights.topCategory || (categories.length > 0 ? categories[0] : null)
  const top3 = products.slice(0, 3)
  const top3Details = top3.map((p, idx) => `${idx + 1}. ${p.name} (¥${Math.round(p.totalSales).toLocaleString()} · ${p.totalUnits} 件)`).join('\n')

  return [
    `【产品销售分析】`,
    `当前数据集中销售额最高的产品是「${topProd.name}」：`,
    `• 累计销售金额：¥ ${Math.round(topProd.totalSales).toLocaleString()}`,
    `• 累计销售数量：${topProd.totalUnits} 件（涉及 ${topProd.orderCount} 笔订单）`,
    `• 全盘销售额占比：${topProd.percentage}%`,
    topCat ? `• 所属主力产品大类：「${topCat.name}」（品类总额 ¥${Math.round(topCat.totalSales).toLocaleString()}）` : '',
    `\n单品销售额前 ${top3.length} 名榜单：`,
    top3Details
  ].filter(Boolean).join('\n')
}

/**
 * Helper to match date field in row
 */
function findDateValue(row: Record<string, any>): string {
  const candidates = ['date', '日期', '订单日期', '成交时间', '时间', '下单日期', '销售日期', 'Date', 'DATE']
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') {
      return String(row[c]).trim()
    }
  }
  return ''
}

/**
 * Helper to match sales value in row
 */
function findSalesValue(row: Record<string, any>): number {
  const candidates = ['sales', '销售金额', '销售额', '金额', '销售额 (元)', '销售额(元)', '收入', '实付金额', '总额', '总销售额', 'Sales', 'SALES', 'amount', 'Amount']
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') {
      const num = Number(row[c])
      if (!isNaN(num)) return num
    }
  }
  return 0
}

/**
 * Helper to match units value in row
 */
function findUnitsValue(row: Record<string, any>): number {
  const candidates = ['units', '销售数量', '销量', '数量', '订单量', '件数', '销量 (件)', '销量(件)', 'Units', 'UNITS', 'Quantity', 'quantity']
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') {
      const num = Number(row[c])
      if (!isNaN(num) && num > 0) return num
    }
  }
  return 1
}

/**
 * Handler 4: Monthly Sales & Date Query
 */
function handleMonthlySales(
  intent: QueryIntent,
  context: DatasetAnalysisContext,
  rawData: DynamicExcelRow[]
): string {
  const { dateTrend, overview } = context

  // A. Specified Month Query (e.g. "7月销售额是多少？", "8月销售额多少？")
  if (intent.month !== undefined) {
    const targetMonth = intent.month
    let monthTotalSales = 0
    let monthTotalOrders = 0
    let monthTotalUnits = 0

    rawData.forEach(row => {
      const dStr = findDateValue(row)
      if (!dStr) return

      let rowMonth: number | null = null
      const ymdMatch = dStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
      if (ymdMatch) {
        rowMonth = parseInt(ymdMatch[2], 10)
      } else {
        const mdMatch = dStr.match(/^(\d{1,2})[-/](\d{1,2})/)
        if (mdMatch) {
          rowMonth = parseInt(mdMatch[1], 10)
        }
      }

      if (rowMonth === targetMonth) {
        monthTotalSales += findSalesValue(row)
        monthTotalOrders += 1
        monthTotalUnits += findUnitsValue(row)
      }
    })

    if (monthTotalOrders > 0) {
      const ratio = overview.totalSales > 0 ? ((monthTotalSales / overview.totalSales) * 100).toFixed(1) : '0'
      const avgAov = Math.round(monthTotalSales / monthTotalOrders)
      return [
        `【${targetMonth} 月销售统计结果】`,
        `• ${targetMonth} 月销售总额：¥ ${Math.round(monthTotalSales).toLocaleString()}`,
        `• ${targetMonth} 月成交订单数：${monthTotalOrders} 笔`,
        `• ${targetMonth} 月销售商品数量：${monthTotalUnits} 件`,
        `• ${targetMonth} 月笔均客单价：¥ ${avgAov.toLocaleString()}`,
        `• 占全盘销售总额比重：${ratio}%`
      ].join('\n')
    } else {
      return [
        `【时间范围提示】当前数据集中未查询到 ${targetMonth} 月的销售记录。`,
        `• 当前数据记录的日期范围为：${dateTrend.startDate || '未知'} 至 ${dateTrend.endDate || '未知'}`,
        `• 实际有效销售天数：${dateTrend.activeSalesDays} 天`
      ].join('\n')
    }
  }

  // B. General Date Trend / Peak Day Query (e.g. "哪一天销售额最高？")
  if (dateTrend.peakDate) {
    return [
      `【销售时间趋势分析】`,
      `• 历史单日最高销售额：¥ ${Math.round(dateTrend.peakDateSales).toLocaleString()}（发生于 ${dateTrend.peakDate}）`,
      `• 统计周期区间：${dateTrend.startDate} 至 ${dateTrend.endDate}`,
      `• 活跃销售天数：${dateTrend.activeSalesDays} 天`,
      `• 日均销售额：¥ ${Math.round(dateTrend.dailyAverageSales).toLocaleString()}`
    ].join('\n')
  }

  return '【时间分析】当前数据集中未检测到有效的时间日期字段。'
}

/**
 * Handler 5: Largest Single Order Query
 */
function handleLargestOrder(_intent: QueryIntent, context: DatasetAnalysisContext): string {
  const { highlights, overview } = context
  const bigOrder = highlights.largestSingleOrder

  if (!bigOrder || bigOrder.salesAmount <= 0) {
    return '【最大订单分析】当前数据集中未能识别到有效的单笔订单金额记录。'
  }

  const orderRatio = overview.totalSales > 0
    ? ((bigOrder.salesAmount / overview.totalSales) * 100).toFixed(1)
    : '0'

  return [
    `【单笔最大订单明细】`,
    `当前数据集中金额最高的一笔订单明细如下：`,
    `• 订单金额：¥ ${Math.round(bigOrder.salesAmount).toLocaleString()}`,
    bigOrder.orderId ? `• 订单编号：${bigOrder.orderId}` : '',
    bigOrder.customerName ? `• 客户名称：${bigOrder.customerName}` : '',
    bigOrder.productName ? `• 采购产品：${bigOrder.productName}` : '',
    bigOrder.salesRep ? `• 签单销售代表：${bigOrder.salesRep}` : '',
    bigOrder.date ? `• 订单日期：${bigOrder.date}` : '',
    `• 该单贡献度：占全盘销售总额的 ${orderRatio}%`
  ].filter(Boolean).join('\n')
}

/**
 * Handler 6: Data Overview Query
 */
function handleDataOverview(_intent: QueryIntent, context: DatasetAnalysisContext): string {
  const { overview, dateTrend, highlights } = context

  return [
    `【全盘数据概览与核心指标】`,
    `• 总销售额 (Total Sales)：¥ ${Math.round(overview.totalSales).toLocaleString()}`,
    `• 累计有效订单数 (Orders)：${overview.totalOrders} 笔`,
    `• 累计销售商品数量 (Units)：${overview.totalUnits} 件`,
    `• 笔均客单价 (AOV)：¥ ${Math.round(overview.averageOrderValue).toLocaleString()}`,
    `• 单件商品均价：约 ¥ ${Math.round(overview.averageUnitPrice).toLocaleString()}`,
    dateTrend.startDate ? `• 统计日期范围：${dateTrend.startDate} 至 ${dateTrend.endDate}` : '',
    highlights.topRegion ? `• 主力区域冠军：${highlights.topRegion.name} (¥${Math.round(highlights.topRegion.totalSales).toLocaleString()})` : '',
    highlights.topSalesRep ? `• 销售代表冠军：${highlights.topSalesRep.name} (¥${Math.round(highlights.topSalesRep.totalSales).toLocaleString()})` : ''
  ].filter(Boolean).join('\n')
}

/**
 * Handler 7: Unsupported Query Fallback
 */
function handleUnsupportedQuery(rawQuery: string): string {
  return [
    `已为您扫描当前表格（提问：「${rawQuery}」）。`,
    `规则分析引擎当前支持以下 6 类真实数据查询：`,
    `1. 地区销售（例：“哪个地区销售额最高？”、“华东销售额多少？”）`,
    `2. 销售人员（例：“谁卖得最好？”、“哪个销售员销售额最高？”）`,
    `3. 产品与品类（例：“哪个产品销售额最高？”、“SaaS 软件卖了多少？”）`,
    `4. 月度与时间（例：“8 月销售额是多少？”、“哪一天销售额最高？”）`,
    `5. 最大订单（例：“最大的一笔订单是多少？”、“哪一笔订单金额最高？”）`,
    `6. 大盘总览（例：“总销售额是多少？”、“客单价是多少？”）`,
    `\n请尝试以上述方式提问，系统将基于当前真实数据实时计算并解答。`
  ].join('\n')
}

/**
 * Main Entry Point: Query Engine
 * Pipeline: query → intent → calculation → response
 */
export function answerNaturalLanguageQuery(
  query: string,
  context: DatasetAnalysisContext | null | undefined,
  rawData: DynamicExcelRow[] = []
): string {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) {
    return '请输入您想了解的数据分析问题。'
  }

  // Empty data check
  if (!context || !rawData || rawData.length === 0 || context.overview.totalOrders === 0) {
    return '【提示】当前尚未载入任何 Excel 数据。请先在页面顶部点击「加载示例销售数据」或拖入本地 .xlsx 文件后再次提问。'
  }

  // 1. Intent Recognition
  const intent = recognizeQueryIntent(trimmedQuery, context)

  // 2. Calculation & Response Dispatch
  switch (intent.type) {
    case 'REGION_SALES':
      return handleRegionSales(intent, context)
    case 'SALES_REP':
      return handleSalesRep(intent, context)
    case 'PRODUCT_SALES':
      return handleProductSales(intent, context)
    case 'MONTHLY_SALES':
      return handleMonthlySales(intent, context, rawData)
    case 'LARGEST_ORDER':
      return handleLargestOrder(intent, context)
    case 'DATA_OVERVIEW':
      return handleDataOverview(intent, context)
    case 'UNSUPPORTED':
    default:
      return handleUnsupportedQuery(trimmedQuery)
  }
}
