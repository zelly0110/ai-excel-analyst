import type {
  DatasetAnalysisContext,
  DynamicExcelRow,
  ProactiveInsight
} from '../types/excel'
import { analyzeSalesTrend } from './dataAnalyzer'

export type { ProactiveInsight }

/**
 * Structured Fact Representation for Proactive Insights
 * Decoupled from natural language templates to enable future LLM prompt conversion
 */
export interface StructuredInsightFact {
  ruleId:
    | 'SALES_TREND_DROP'
    | 'SALES_TREND_PEAK'
    | 'SALES_TREND_GROWTH'
    | 'REGION_LOW_SHARE'
    | 'REGION_TOP_CORE'
    | 'PRODUCT_TOP_SALES'
    | 'PRODUCT_TOP_UNITS'
    | 'CATEGORY_TOP_SHARE'
    | 'SALES_REP_CHAMPION'
    | 'SALES_REP_LOW_PERFORMER'
  type: 'warning' | 'trend' | 'opportunity'
  dimension: 'date' | 'region' | 'product' | 'category' | 'salesRep' | 'overall'
  targetName: string
  metrics: {
    actualValue?: number
    benchmarkValue?: number
    percentage?: number
    diffPercentage?: number
    orderCount?: number
    unitCount?: number
    formattedActual?: string
    formattedBenchmark?: string
  }
  severity: 'high' | 'medium' | 'low'
  tags: string[]
}

/**
 * Rule 1: Sales Trend Anomaly & Growth Detection
 */
function analyzeSalesTrendAnomalies(
  _context: DatasetAnalysisContext,
  rawData: DynamicExcelRow[]
): StructuredInsightFact[] {
  const facts: StructuredInsightFact[] = []
  const trendData = analyzeSalesTrend(rawData)

  if (!trendData.dates || trendData.dates.length === 0) {
    return facts
  }

  const { dates, sales } = trendData
  const validDays = dates.length
  const totalSales = sales.reduce((acc, curr) => acc + curr, 0)
  const avgDailySales = validDays > 0 ? totalSales / validDays : 0

  if (avgDailySales <= 0) {
    return facts
  }

  // 1.1 Anomaly Drop Detection: Find day with significant drop vs average
  let maxDropRatio = 0
  let worstDate = ''
  let worstDateSales = 0

  dates.forEach((dateStr, idx) => {
    const daySales = sales[idx]
    if (daySales < avgDailySales) {
      const dropRatio = (avgDailySales - daySales) / avgDailySales
      if (dropRatio > maxDropRatio) {
        maxDropRatio = dropRatio
        worstDate = dateStr
        worstDateSales = daySales
      }
    }
  })

  // Trigger warning if drop is >= 35% compared to daily average (or for single significant drop)
  if (worstDate && (maxDropRatio >= 0.35 || (validDays <= 5 && maxDropRatio >= 0.25))) {
    const dropPercent = Math.round(maxDropRatio * 100)
    facts.push({
      ruleId: 'SALES_TREND_DROP',
      type: 'warning',
      dimension: 'date',
      targetName: worstDate,
      metrics: {
        actualValue: worstDateSales,
        benchmarkValue: Math.round(avgDailySales * 100) / 100,
        diffPercentage: dropPercent,
        formattedActual: `¥${Math.round(worstDateSales).toLocaleString()}`,
        formattedBenchmark: `¥${Math.round(avgDailySales).toLocaleString()}`
      },
      severity: dropPercent >= 60 ? 'high' : 'medium',
      tags: ['趋势异常', '销售下跌', worstDate]
    })
  }

  // 1.2 Peak Day Detection (if peak sales is >= 40% above daily average)
  let peakDate = ''
  let peakSales = 0
  dates.forEach((dateStr, idx) => {
    if (sales[idx] > peakSales) {
      peakSales = sales[idx]
      peakDate = dateStr
    }
  })

  if (peakDate && peakSales >= avgDailySales * 1.4 && validDays >= 3) {
    const risePercent = Math.round(((peakSales - avgDailySales) / avgDailySales) * 100)
    facts.push({
      ruleId: 'SALES_TREND_PEAK',
      type: 'trend',
      dimension: 'date',
      targetName: peakDate,
      metrics: {
        actualValue: peakSales,
        benchmarkValue: Math.round(avgDailySales * 100) / 100,
        diffPercentage: risePercent,
        formattedActual: `¥${Math.round(peakSales).toLocaleString()}`,
        formattedBenchmark: `¥${Math.round(avgDailySales).toLocaleString()}`
      },
      severity: 'medium',
      tags: ['单日峰值', '业绩突破', peakDate]
    })
  }

  // 1.3 Consecutive Growth Trend Detection (last 3+ days increasing)
  if (validDays >= 3) {
    let consecutiveUpCount = 1
    for (let i = sales.length - 1; i > 0; i--) {
      if (sales[i] >= sales[i - 1]) {
        consecutiveUpCount++
      } else {
        break
      }
    }

    if (consecutiveUpCount >= 3) {
      facts.push({
        ruleId: 'SALES_TREND_GROWTH',
        type: 'trend',
        dimension: 'date',
        targetName: '近期销售趋势',
        metrics: {
          actualValue: consecutiveUpCount,
          formattedActual: `连续 ${consecutiveUpCount} 日增长`
        },
        severity: 'medium',
        tags: ['持续增长', '市场回暖']
      })
    }
  }

  return facts
}

/**
 * Rule 2: Regional Sales Contribution & Anomaly Analysis
 */
function analyzeRegionAnomalies(
  context: DatasetAnalysisContext
): StructuredInsightFact[] {
  const facts: StructuredInsightFact[] = []
  const { dimensions, overview } = context
  const regions = dimensions.byRegion

  if (!regions || regions.length === 0) {
    return facts
  }

  const regionCount = regions.length
  const avgRegionSales = regionCount > 0 ? overview.totalSales / regionCount : 0

  // 2.1 Low Share Regional Anomaly (Warning)
  if (regionCount >= 2) {
    const lowestRegion = regions[regions.length - 1]
    const isSalesLow = lowestRegion.percentage <= 8 || (avgRegionSales > 0 && lowestRegion.totalSales < avgRegionSales * 0.4)
    const isOrderLow = overview.totalOrders > 0 && lowestRegion.orderCount <= Math.max(1, Math.floor(overview.totalOrders / (regionCount * 2.5)))

    if (isSalesLow || isOrderLow) {
      facts.push({
        ruleId: 'REGION_LOW_SHARE',
        type: 'warning',
        dimension: 'region',
        targetName: lowestRegion.name,
        metrics: {
          actualValue: lowestRegion.totalSales,
          benchmarkValue: Math.round(avgRegionSales),
          percentage: lowestRegion.percentage,
          orderCount: lowestRegion.orderCount,
          unitCount: lowestRegion.totalUnits,
          formattedActual: `¥${Math.round(lowestRegion.totalSales).toLocaleString()}`,
          formattedBenchmark: `¥${Math.round(avgRegionSales).toLocaleString()}`
        },
        severity: lowestRegion.percentage <= 5 ? 'high' : 'medium',
        tags: ['区域预警', lowestRegion.name, '渠道拓展']
      })
    }
  }

  // 2.2 Core Dominant Region (Opportunity/Trend)
  const topRegion = regions[0]
  if (topRegion && (topRegion.percentage >= 28 || regionCount === 1)) {
    facts.push({
      ruleId: 'REGION_TOP_CORE',
      type: 'opportunity',
      dimension: 'region',
      targetName: topRegion.name,
      metrics: {
        actualValue: topRegion.totalSales,
        percentage: topRegion.percentage,
        orderCount: topRegion.orderCount,
        unitCount: topRegion.totalUnits,
        formattedActual: `¥${Math.round(topRegion.totalSales).toLocaleString()}`
      },
      severity: 'medium',
      tags: ['主力区域', topRegion.name, '核心市场']
    })
  }

  return facts
}

/**
 * Rule 3: Product Opportunity & SKU Discovery
 */
function analyzeProductOpportunities(
  context: DatasetAnalysisContext
): StructuredInsightFact[] {
  const facts: StructuredInsightFact[] = []
  const { dimensions, highlights } = context
  const products = dimensions.byProduct

  if (!products || products.length === 0) {
    return facts
  }

  // 3.1 Top Revenue Product (Opportunity)
  const topProductBySales = products[0]
  if (topProductBySales) {
    facts.push({
      ruleId: 'PRODUCT_TOP_SALES',
      type: 'opportunity',
      dimension: 'product',
      targetName: topProductBySales.name,
      metrics: {
        actualValue: topProductBySales.totalSales,
        percentage: topProductBySales.percentage,
        orderCount: topProductBySales.orderCount,
        unitCount: topProductBySales.totalUnits,
        formattedActual: `¥${Math.round(topProductBySales.totalSales).toLocaleString()}`
      },
      severity: 'high',
      tags: ['核心产品', '收入支柱', topProductBySales.name]
    })
  }

  // 3.2 Top Volume Product (Opportunity)
  const sortedByUnits = [...products].sort((a, b) => b.totalUnits - a.totalUnits)
  const topProductByUnits = sortedByUnits[0]

  if (topProductByUnits && topProductByUnits.name !== topProductBySales.name) {
    facts.push({
      ruleId: 'PRODUCT_TOP_UNITS',
      type: 'opportunity',
      dimension: 'product',
      targetName: topProductByUnits.name,
      metrics: {
        actualValue: topProductByUnits.totalUnits,
        orderCount: topProductByUnits.orderCount,
        formattedActual: `${topProductByUnits.totalUnits} 件`
      },
      severity: 'medium',
      tags: ['销量冠军', '爆款走量', topProductByUnits.name]
    })
  }

  // 3.3 Top Category Demand Trend
  if (highlights.topCategory && dimensions.byCategory.length > 1) {
    const topCat = highlights.topCategory
    facts.push({
      ruleId: 'CATEGORY_TOP_SHARE',
      type: 'trend',
      dimension: 'category',
      targetName: topCat.name,
      metrics: {
        actualValue: topCat.totalSales,
        percentage: topCat.percentage,
        orderCount: topCat.orderCount,
        formattedActual: `¥${Math.round(topCat.totalSales).toLocaleString()}`
      },
      severity: 'medium',
      tags: ['核心品类', topCat.name]
    })
  }

  return facts
}

/**
 * Rule 4: Sales Representative Performance Ladder & Anomaly
 */
function analyzeSalesRepPerformance(
  context: DatasetAnalysisContext
): StructuredInsightFact[] {
  const facts: StructuredInsightFact[] = []
  const { dimensions, overview } = context
  const reps = dimensions.bySalesRep

  if (!reps || reps.length === 0) {
    return facts
  }

  const repCount = reps.length
  const avgRepSales = repCount > 0 ? overview.totalSales / repCount : 0

  // 4.1 Sales Champion (Opportunity/Trend)
  const topRep = reps[0]
  if (topRep) {
    facts.push({
      ruleId: 'SALES_REP_CHAMPION',
      type: 'opportunity',
      dimension: 'salesRep',
      targetName: topRep.name,
      metrics: {
        actualValue: topRep.totalSales,
        percentage: topRep.percentage,
        orderCount: topRep.orderCount,
        unitCount: topRep.totalUnits,
        formattedActual: `¥${Math.round(topRep.totalSales).toLocaleString()}`
      },
      severity: 'high',
      tags: ['销售冠军', topRep.name, '团队标杆']
    })
  }

  // 4.2 Low Performing Sales Rep (Warning)
  if (repCount >= 2) {
    const lowRep = reps[reps.length - 1]
    const isSalesLagging = lowRep.percentage < 12 || (avgRepSales > 0 && lowRep.totalSales < avgRepSales * 0.45)
    
    if (isSalesLagging && lowRep.name !== topRep.name) {
      facts.push({
        ruleId: 'SALES_REP_LOW_PERFORMER',
        type: 'warning',
        dimension: 'salesRep',
        targetName: lowRep.name,
        metrics: {
          actualValue: lowRep.totalSales,
          benchmarkValue: Math.round(avgRepSales),
          percentage: lowRep.percentage,
          orderCount: lowRep.orderCount,
          unitCount: lowRep.totalUnits,
          formattedActual: `¥${Math.round(lowRep.totalSales).toLocaleString()}`,
          formattedBenchmark: `¥${Math.round(avgRepSales).toLocaleString()}`
        },
        severity: 'medium',
        tags: ['业绩预警', lowRep.name, '转化支持']
      })
    }
  }

  return facts
}

/**
 * Template Formatter: Formats structured facts into user-facing ProactiveInsight cards
 */
function formatFactToInsight(fact: StructuredInsightFact): ProactiveInsight {
  const { ruleId, type, targetName, metrics, tags, dimension, severity } = fact

  let title = ''
  let description = ''
  let metricDisplay: string | undefined = undefined

  switch (ruleId) {
    case 'SALES_TREND_DROP':
      title = `${targetName} 销售额异常下降`
      description = `当天销售额 ${metrics.formattedActual}，比周期平均水平（${metrics.formattedBenchmark}）下降 ${metrics.diffPercentage}%，建议排查当天订单转化与外部异动因素。`
      metricDisplay = `-${metrics.diffPercentage}%`
      break

    case 'SALES_TREND_PEAK':
      title = `${targetName} 创单日销售高峰`
      description = `当天销售额达到 ${metrics.formattedActual}，大幅超出日常平均水平（${metrics.formattedBenchmark}）${metrics.diffPercentage}%，创下阶段销售峰值记录。`
      metricDisplay = `+${metrics.diffPercentage}%`
      break

    case 'SALES_TREND_GROWTH':
      title = `销售趋势呈现持续增长态势`
      description = `销售数据近期连续多日稳步上扬，市场活力持续释放，可把握增长窗口加大主推产品曝光。`
      metricDisplay = `持续走强`
      break

    case 'REGION_LOW_SHARE':
      title = `${targetName} 区域销售贡献偏低，需要关注`
      description = `${targetName} 累计销售额 ${metrics.formattedActual}（仅占全盘 ${metrics.percentage}%，成交 ${metrics.orderCount} 笔），订单量明显低于其他区域均值（${metrics.formattedBenchmark}），建议跟进当地渠道建设。`
      metricDisplay = `${metrics.percentage}% 占比`
      break

    case 'REGION_TOP_CORE':
      title = `${targetName} 是当前核心销售主力区`
      description = `${targetName} 累计贡献销售额 ${metrics.formattedActual}，占总销售额的 ${metrics.percentage}%（成交 ${metrics.orderCount} 笔），是当前最稳固的基本盘市场。`
      metricDisplay = `${metrics.percentage}% 贡献`
      break

    case 'PRODUCT_TOP_SALES':
      title = `「${targetName}」是当前核心销售产品`
      description = `该产品累计销售额达 ${metrics.formattedActual}（全盘占比 ${metrics.percentage}%，累计销量 ${metrics.unitCount || metrics.orderCount} 件），为当前首要创收支柱。`
      metricDisplay = metrics.formattedActual
      break

    case 'PRODUCT_TOP_UNITS':
      title = `「${targetName}」销量领跑，具备爆款潜质`
      description = `累计销售 ${metrics.formattedActual}（涉及 ${metrics.orderCount} 笔订单），展现出极高的走量与市场认可度，可作为引流爆款搭配推广。`
      metricDisplay = metrics.formattedActual
      break

    case 'CATEGORY_TOP_SHARE':
      title = `「${targetName}」品类领跑市场需求`
      description = `「${targetName}」品类总销售额达 ${metrics.formattedActual}，在全品类中占比 ${metrics.percentage}%，建议持续优化该品类供应链并扩充商品线。`
      metricDisplay = `${metrics.percentage}% 占比`
      break

    case 'SALES_REP_CHAMPION':
      title = `${targetName} 贡献 ${metrics.percentage}% 销售额，是当前销售冠军`
      description = `销售代表「${targetName}」累计签单 ${metrics.orderCount} 笔，实现销售额 ${metrics.formattedActual}，个人创收领跑团队，建议提炼优秀展业经验。`
      metricDisplay = `${metrics.percentage}% 贡献`
      break

    case 'SALES_REP_LOW_PERFORMER':
      title = `销售代表「${targetName}」业绩偏低，需关注转化瓶颈`
      description = `该代表累计销售额 ${metrics.formattedActual}（占全盘 ${metrics.percentage}%，成交 ${metrics.orderCount} 笔），低于团队人均水平（${metrics.formattedBenchmark}），建议提供辅导与线索支持。`
      metricDisplay = metrics.formattedActual
      break

    default:
      title = `发现与「${targetName}」相关的业务特征`
      description = `根据当前数据维度统计，该项指标存在值得关注的业务波动。`
      metricDisplay = metrics.formattedActual
      break
  }

  return {
    type,
    title,
    description,
    metric: metricDisplay,
    tags,
    meta: {
      category: ruleId,
      dimension,
      severity,
      benchmark: metrics.benchmarkValue,
      actual: metrics.actualValue,
      diffPercent: metrics.diffPercentage
    }
  }
}

/**
 * Main Entry Point: Generate Proactive Insights from Dataset Analysis Context and Raw Rows
 */
export function generateProactiveInsights(
  context: DatasetAnalysisContext,
  rawData: DynamicExcelRow[]
): ProactiveInsight[] {
  if (!context || !rawData || rawData.length === 0 || context.overview.totalOrders === 0) {
    return []
  }

  // 1. Extract structured facts across the 4 key business dimensions
  const facts: StructuredInsightFact[] = [
    ...analyzeSalesTrendAnomalies(context, rawData),
    ...analyzeRegionAnomalies(context),
    ...analyzeProductOpportunities(context),
    ...analyzeSalesRepPerformance(context)
  ]

  // 2. Format structured facts into ProactiveInsight cards
  const insights = facts.map(fact => formatFactToInsight(fact))

  // 3. Deduplicate / Prioritize: warnings first, then opportunities, then trends
  const priorityOrder: Record<ProactiveInsight['type'], number> = {
    warning: 1,
    opportunity: 2,
    trend: 3
  }

  return insights.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type])
}

/**
 * Convert Proactive Insights and Analysis Context into LLM Prompt
 * Designed for seamless extension to DeepSeek / GPT-4 / Gemini
 */
export function buildProactiveInsightsPrompt(
  insights: ProactiveInsight[],
  context: DatasetAnalysisContext
): string {
  const { overview, dateTrend, highlights } = context

  const promptSections = [
    `# 商业数据分析报告与诊断提示词 (AI Proactive Analysis Context)`,
    ``,
    `## 1. 数据集基础概览`,
    `- 总销售额: ¥${Math.round(overview.totalSales).toLocaleString()}`,
    `- 总订单量: ${overview.totalOrders} 笔`,
    `- 总销售件数: ${overview.totalUnits} 件`,
    `- 平均客单价 (AOV): ¥${Math.round(overview.averageOrderValue).toLocaleString()}`,
    `- 统计时间跨度: ${dateTrend.startDate || '未知'} 至 ${dateTrend.endDate || '未知'} (共 ${dateTrend.activeSalesDays} 个有效销售日)`,
    ``,
    `## 2. 统计规则引擎主动捕获的关键洞察 (共 ${insights.length} 项)`,
    ...insights.map((ins, index) => {
      const typeLabel = ins.type === 'warning' ? '[⚠️ 风险预警]' : ins.type === 'opportunity' ? '[💡 业务机会]' : '[📈 趋势特征]'
      return `${index + 1}. ${typeLabel} **${ins.title}**\n   - 详情: ${ins.description}\n   - 关键指标: ${ins.metric || '无'}\n   - 标签: ${ins.tags.join(', ')}`
    }),
    ``,
    `## 3. 核心标杆数据`,
    `- 销售冠军区域: ${highlights.topRegion ? `${highlights.topRegion.name} (${highlights.topRegion.percentage}%)` : '无'}`,
    `- 销售冠军单品: ${highlights.topProduct ? `${highlights.topProduct.name} (¥${Math.round(highlights.topProduct.totalSales).toLocaleString()})` : '无'}`,
    `- 销售冠军代表: ${highlights.topSalesRep ? `${highlights.topSalesRep.name} (贡献 ${highlights.topSalesRep.percentage}%)` : '无'}`,
    ``,
    `## 4. LLM 任务指令`,
    `请作为资深商业数据分析专家，结合上述事实数据和已识别的风险/机会，生成一份结构化的管理决策建议报告。输出包含：`,
    `1. 核心经营问题诊断 (针对所有 warning 风险)`,
    `2. 增长突破点策略 (针对 opportunity 机会与 trend 趋势)`,
    `3. 下一步行动清单 (优先级排序及负责人角色建议)`
  ]

  return promptSections.join('\n')
}
