import type {
  DatasetAnalysisContext,
  ProactiveInsight,
  MetricCard,
  BusinessReport,
  BusinessReportMetric,
  BusinessReportItem
} from '../types/excel'

export type { BusinessReport, BusinessReportMetric, BusinessReportItem }

/**
 * Format current date & time for report timestamp
 */
function formatCurrentDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const date = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`
}

/**
 * Generate a comprehensive, professional Business Daily Report derived strictly from actual calculated facts
 */
export function generateBusinessReport(
  context: DatasetAnalysisContext,
  insights: ProactiveInsight[] = [],
  _metrics: MetricCard[] = []
): BusinessReport {
  const { overview, dateTrend, dimensions, highlights } = context
  const timestamp = formatCurrentDateTime()

  // 1. Date Range
  let dateRangeText = '暂无时间范围'
  if (dateTrend.startDate && dateTrend.endDate) {
    dateRangeText = dateTrend.startDate === dateTrend.endDate
      ? dateTrend.startDate
      : `${dateTrend.startDate} 至 ${dateTrend.endDate}`
  }

  // 2. Title
  const title = dateTrend.endDate
    ? `${dateTrend.endDate} 商业经营决策日报`
    : 'AI 商业经营分析决策简报'

  // If no data
  if (!overview || overview.totalOrders === 0) {
    return {
      title,
      summary: '暂无可用的业务订单数据，请先载入示例数据或上传 Excel 文件。',
      generatedAt: timestamp,
      dateRange: dateRangeText,
      totalOrders: 0,
      keyMetrics: [],
      highlights: [],
      risks: [],
      suggestions: []
    }
  }

  // 3. Key Metrics (今日经营概览)
  const avgUnitsPerOrder = (overview.totalUnits / overview.totalOrders).toFixed(1)
  const keyMetrics: BusinessReportMetric[] = [
    {
      label: '总销售额 (Sales)',
      value: `¥ ${Math.round(overview.totalSales).toLocaleString()}`,
      change: `共 ${overview.totalOrders} 笔订单`,
      trend: 'up',
      tip: dateTrend.activeSalesDays > 0
        ? `日均 ¥${Math.round(dateTrend.dailyAverageSales).toLocaleString()} · 覆盖 ${dateTrend.activeSalesDays} 个销售日`
        : `全周期累计有效销售金额`
    },
    {
      label: '成交订单量 (Orders)',
      value: `${overview.totalOrders} 笔`,
      change: `商品总量 ${overview.totalUnits.toLocaleString()} 件`,
      trend: 'up',
      tip: `有效成交笔数汇总`
    },
    {
      label: '平均客单价 (AOV)',
      value: `¥ ${Math.round(overview.averageOrderValue).toLocaleString()}`,
      change: `单均 ${avgUnitsPerOrder} 件商品`,
      trend: 'neutral',
      tip: `总销售额 / 订单总数`
    },
    {
      label: '单件均价 (ASP)',
      value: `¥ ${Math.round(overview.averageUnitPrice).toLocaleString()}`,
      change: `累计 ${dimensions.byProduct.length} 款商品`,
      trend: 'up',
      tip: `总销售额 / 销售总件数`
    }
  ]

  // 4. Executive Summary
  const topRegionStr = highlights.topRegion
    ? `核心区域「${highlights.topRegion.name}」（占比 ${highlights.topRegion.percentage}%）`
    : '各区域均衡贡献'
  const topProductStr = highlights.topProduct
    ? `明星单品「${highlights.topProduct.name}」`
    : '多品类商品'
  const topRepStr = highlights.topSalesRep
    ? `销售冠军「${highlights.topSalesRep.name}」（贡献 ${highlights.topSalesRep.percentage}%）`
    : '团队全员协同'

  const warningCount = insights.filter(i => i.type === 'warning').length
  const riskSummaryText = warningCount > 0
    ? `当前检测到 ${warningCount} 项重点关注风险（包含单日波动或区域渠道薄弱），需重点跟进优化。`
    : `整体运营与回款节奏平稳，各业务维度运转健康。`

  const summary = `本期经营周期（${dateRangeText}）累计完成销售额 ¥${Math.round(overview.totalSales).toLocaleString()}，成交订单 ${overview.totalOrders} 笔，累计销售商品 ${overview.totalUnits.toLocaleString()} 件，笔均客单价达 ¥${Math.round(overview.averageOrderValue).toLocaleString()}。在业务结构中，${topRegionStr} 与 ${topProductStr} 构成最主要收入增长支柱，${topRepStr} 领跑团队创收。${riskSummaryText}`

  // 5. Highlights (🔥 核心表现)
  const reportHighlights: BusinessReportItem[] = []

  // 5.1 Region Leader
  if (highlights.topRegion) {
    const topReg = highlights.topRegion
    reportHighlights.push({
      id: 'hl-region',
      title: `${topReg.name} 贡献全盘 ${topReg.percentage}% 销售额，稳居区域榜首`,
      detail: `累计实现销售额 ¥${Math.round(topReg.totalSales).toLocaleString()}（成交 ${topReg.orderCount} 笔订单，销售商品 ${topReg.totalUnits} 件），为当前最稳固的基本盘主力市场。`,
      tag: '主力区域',
      metric: `${topReg.percentage}% 占比`,
      severity: 'high'
    })
  }

  // 5.2 Product Revenue Pillar
  if (highlights.topProduct) {
    const topProd = highlights.topProduct
    reportHighlights.push({
      id: 'hl-product',
      title: `「${topProd.name}」成为核心收入支柱`,
      detail: `累计贡献销售额 ¥${Math.round(topProd.totalSales).toLocaleString()}（全盘占比 ${topProd.percentage}%，销量 ${topProd.totalUnits} 件），展现出极高的客户采购意愿与营收带动能力。`,
      tag: '核心单品',
      metric: `¥${Math.round(topProd.totalSales).toLocaleString()}`,
      severity: 'high'
    })
  }

  // 5.3 Product Volume Leader (if different from top sales)
  const sortedByUnits = [...dimensions.byProduct].sort((a, b) => b.totalUnits - a.totalUnits)
  const topUnitProd = sortedByUnits[0]
  if (topUnitProd && (!highlights.topProduct || topUnitProd.name !== highlights.topProduct.name)) {
    reportHighlights.push({
      id: 'hl-volume-product',
      title: `「${topUnitProd.name}」位列销量榜首，具备高周转引流属性`,
      detail: `累计销售 ${topUnitProd.totalUnits} 件（涉及 ${topUnitProd.orderCount} 笔订单），具备较强的走量与获客特征，适宜作为引流爆款进行跨品类搭配。`,
      tag: '爆款走量',
      metric: `${topUnitProd.totalUnits} 件销量`
    })
  }

  // 5.4 Sales Rep Champion
  if (highlights.topSalesRep) {
    const topRep = highlights.topSalesRep
    reportHighlights.push({
      id: 'hl-sales-rep',
      title: `销售代表「${topRep.name}」以 ${topRep.percentage}% 贡献率荣膺销售冠军`,
      detail: `累计签单 ${topRep.orderCount} 笔，达成销售额 ¥${Math.round(topRep.totalSales).toLocaleString()}（销售商品 ${topRep.totalUnits} 件），创收能力在销售团队中居于首位。`,
      tag: '团队标杆',
      metric: `${topRep.percentage}% 贡献`
    })
  }

  // 5.5 Peak Day / Growth Trend
  if (dateTrend.peakDate && dateTrend.peakDateSales > dateTrend.dailyAverageSales * 1.3) {
    const risePct = Math.round(((dateTrend.peakDateSales - dateTrend.dailyAverageSales) / (dateTrend.dailyAverageSales || 1)) * 100)
    reportHighlights.push({
      id: 'hl-peak-date',
      title: `${dateTrend.peakDate} 创单日销售高峰 ¥${Math.round(dateTrend.peakDateSales).toLocaleString()}`,
      detail: `当天销售表现突出，较全期日均水平高出 ${risePct}%，显现出良好的峰值突破能力。`,
      tag: '单日峰值',
      metric: `+${risePct}%`
    })
  }

  // 6. Risks (⚠️ 风险提醒)
  const reportRisks: BusinessReportItem[] = []

  // Extract from warning proactive insights
  const warningInsights = insights.filter(i => i.type === 'warning')
  warningInsights.forEach((ins, idx) => {
    reportRisks.push({
      id: `risk-ins-${idx}`,
      title: ins.title,
      detail: ins.description,
      tag: ins.tags[0] || '预警',
      metric: ins.metric,
      severity: ins.meta?.severity || 'high'
    })
  })

  // Lagging Region fallback check if not already in warnings
  if (dimensions.byRegion.length >= 2) {
    const lowestRegion = dimensions.byRegion[dimensions.byRegion.length - 1]
    const alreadyIncluded = reportRisks.some(r => r.title.includes(lowestRegion.name))
    if (!alreadyIncluded && lowestRegion.percentage < 10) {
      reportRisks.push({
        id: 'risk-low-region',
        title: `${lowestRegion.name} 区域销售贡献滞后（仅占 ${lowestRegion.percentage}%）`,
        detail: `累计销售额 ¥${Math.round(lowestRegion.totalSales).toLocaleString()}（成交 ${lowestRegion.orderCount} 笔），订单活跃度明显偏低，需排查当地渠道覆盖与销售支持力度。`,
        tag: '区域预警',
        metric: `${lowestRegion.percentage}% 占比`,
        severity: 'medium'
      })
    }
  }

  // Single large order concentration risk
  if (highlights.largestSingleOrder && overview.totalSales > 0) {
    const bigOrderRatio = (highlights.largestSingleOrder.salesAmount / overview.totalSales) * 100
    if (bigOrderRatio >= 20) {
      reportRisks.push({
        id: 'risk-big-order-concentration',
        title: `单笔峰值大单占比达 ${bigOrderRatio.toFixed(1)}%，需关注大单依赖度`,
        detail: `最大单笔订单金额 ¥${Math.round(highlights.largestSingleOrder.salesAmount).toLocaleString()}（客户：${highlights.largestSingleOrder.customerName || '重点客户'}），单客集中度较高，建议拓宽中腰部客户群防范波动。`,
        tag: '集中度预警',
        metric: `${bigOrderRatio.toFixed(1)}% 集中度`,
        severity: 'medium'
      })
    }
  }

  // 7. Suggestions (💡 AI 建议)
  const reportSuggestions: BusinessReportItem[] = []

  // 7.1 Regional Strategy
  const weakestRegion = dimensions.byRegion.length >= 2 ? dimensions.byRegion[dimensions.byRegion.length - 1] : null
  if (weakestRegion && weakestRegion.percentage < 15) {
    reportSuggestions.push({
      id: 'sug-region',
      title: `深化「${weakestRegion.name}」下沉渠道渗透，缩小区域业绩梯队差距`,
      detail: `针对 ${weakestRegion.name} 目前仅占 ${weakestRegion.percentage}% 的现状，建议梳理当地代理商与客户商机线索，适度倾斜营销资源或引入针对性促销政策，激发下沉市场需求。`,
      tag: '渠道拓展'
    })
  } else if (highlights.topRegion) {
    reportSuggestions.push({
      id: 'sug-region-expand',
      title: `巩固「${highlights.topRegion.name}」龙头阵地，打造区域样板市场`,
      detail: `持续深耕 ${highlights.topRegion.name} 优势客群，提炼高客单成交模式并向华北、华南等潜力区域复制。`,
      tag: '市场深耕'
    })
  }

  // 7.2 Product Portfolio Strategy
  if (highlights.topProduct && topUnitProd && highlights.topProduct.name !== topUnitProd.name) {
    reportSuggestions.push({
      id: 'sug-product-bundle',
      title: `实施「${topUnitProd.name}」+「${highlights.topProduct.name}」高低搭配组合拳`,
      detail: `利用走量单品「${topUnitProd.name}」的高周转与低门槛获客能力建立客户初次连接，再通过交叉销售转化高毛利核心单品「${highlights.topProduct.name}」，进一步拉升笔均客单价。`,
      tag: '组合营销'
    })
  } else if (highlights.topProduct) {
    reportSuggestions.push({
      id: 'sug-product-push',
      title: `聚焦核心主力单品「${highlights.topProduct.name}」，保障关键产品供应链`,
      detail: `该产品作为当前业绩压舱石（贡献 ${highlights.topProduct.percentage}% 销售额），建议保持充足库存与交付资源，同时策划二次复购与增值模块升级。`,
      tag: '产品聚焦'
    })
  }

  // 7.3 Sales Team Empowerment
  if (highlights.topSalesRep) {
    reportSuggestions.push({
      id: 'sug-sales-rep',
      title: `萃取销冠「${highlights.topSalesRep.name}」展业SOP，建立梯队帮扶赋能机制`,
      detail: `由头部销售代表分享标杆商机跟进技巧与谈判话术，针对业绩落后代表实施 1 对 1 导师帮扶，全面提升团队整体成单转化率。`,
      tag: '团队赋能'
    })
  }

  // 7.4 Anomaly Monitoring
  if (warningInsights.length > 0) {
    reportSuggestions.push({
      id: 'sug-monitoring',
      title: `建立日级别销售波动归因机制与退款商机快速挽回通道`,
      detail: `对单日销售断崖或重点预警指标实行 24 小时快速归因分析，及时排查前端转化与交付节点，防范经营风险累积。`,
      tag: '风控管理'
    })
  }

  return {
    title,
    summary,
    generatedAt: timestamp,
    dateRange: dateRangeText,
    totalOrders: overview.totalOrders,
    keyMetrics,
    highlights: reportHighlights,
    risks: reportRisks,
    suggestions: reportSuggestions,
    rawMeta: {
      totalSales: overview.totalSales,
      totalOrders: overview.totalOrders,
      topRegion: highlights.topRegion?.name,
      topProduct: highlights.topProduct?.name,
      topSalesRep: highlights.topSalesRep?.name,
      warningCount
    }
  }
}

/**
 * Format Business Report into clean Markdown text for user copy
 */
export function formatBusinessReportToMarkdown(report: BusinessReport): string {
  const lines: string[] = [
    `# 📑 ${report.title}`,
    `> **数据范围**: ${report.totalOrders} 条订单 · **时间跨度**: ${report.dateRange} · **生成时间**: ${report.generatedAt}`,
    ``,
    `## 📊 今日经营概览`,
    ...report.keyMetrics.map(m => `- **${m.label}**: ${m.value} (${m.change || ''})`),
    ``,
    `### 📝 核心经营摘要`,
    `${report.summary}`,
    ``,
    `## 🔥 核心表现 (Highlights)`,
    ...report.highlights.map((h, i) => `${i + 1}. **${h.title}**${h.metric ? ` [${h.metric}]` : ''}\n   - ${h.detail}`),
    ``,
    `## ⚠️ 风险提醒 (Risks)`,
    ...report.risks.map((r, i) => `${i + 1}. **${r.title}**${r.metric ? ` [${r.metric}]` : ''}\n   - ${r.detail}`),
    ``,
    `## 💡 AI 建议 (Actionable Suggestions)`,
    ...report.suggestions.map((s, i) => `${i + 1}. **${s.title}**\n   - ${s.detail}`)
  ]

  return lines.join('\n')
}

/**
 * Convert Business Report into a structured LLM Prompt (for DeepSeek / GPT-4 / Gemini)
 */
export function formatBusinessReportToPrompt(
  report: BusinessReport,
  context: DatasetAnalysisContext
): string {
  const { overview, dateTrend, highlights } = context

  const prompt = [
    `# 商业经营决策日报 (AI Executive Daily Report Context)`,
    ``,
    `## 1. 基础经营数据看板`,
    `- 统计时间跨度: ${report.dateRange} (有效销售日: ${dateTrend.activeSalesDays} 天)`,
    `- 累计总销售额: ¥${Math.round(overview.totalSales).toLocaleString()}`,
    `- 累计成交订单: ${overview.totalOrders} 笔`,
    `- 累计销售件数: ${overview.totalUnits} 件`,
    `- 笔均客单价 (AOV): ¥${Math.round(overview.averageOrderValue).toLocaleString()}`,
    `- 单件商品均价: ¥${Math.round(overview.averageUnitPrice).toLocaleString()}`,
    ``,
    `## 2. 核心表现分析 (Highlights)`,
    ...report.highlights.map(h => `- [${h.tag || '表现'}] ${h.title}: ${h.detail}`),
    ``,
    `## 3. 经营风险与异常预警 (Risks)`,
    ...report.risks.map(r => `- [${r.tag || '风险'}] ${r.title}: ${r.detail}`),
    ``,
    `## 4. 规则引擎初步管理建议 (Preliminary Suggestions)`,
    ...report.suggestions.map(s => `- [${s.tag || '建议'}] ${s.title}: ${s.detail}`),
    ``,
    `## 5. 标杆维度数据`,
    `- 销冠区域: ${highlights.topRegion ? `${highlights.topRegion.name} (${highlights.topRegion.percentage}%)` : '无'}`,
    `- 销冠产品: ${highlights.topProduct ? `${highlights.topProduct.name} (¥${Math.round(highlights.topProduct.totalSales).toLocaleString()})` : '无'}`,
    `- 销冠代表: ${highlights.topSalesRep ? `${highlights.topSalesRep.name} (${highlights.topSalesRep.percentage}%)` : '无'}`,
    ``,
    `## 6. LLM 决策专家指令`,
    `请作为首席运营官 (COO) 或资深战略数据顾问，基于上述事实数据和日报内容，生成一份高阶经营决策汇报：`,
    `1. 评估本期业绩达成质量与商业健康度`,
    `2. 针对列出的风险点提出更深入的业务挽回措施与应对预案`,
    `3. 规划下一阶段产品组合与区域营销的资源投放优先级`
  ]

  return prompt.join('\n')
}
