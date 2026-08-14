import type { ExcelRow, MetricCard, AiInsight, QuickPrompt } from '../types/excel'

export const MOCK_EXCEL_DATA: ExcelRow[] = [
  { id: 1, date: '2026-08-01', region: '华东区', product: 'Cloud AI 智能数据分析终端', category: 'SaaS 软件', sales: 128500, units: 42, profitMargin: 68.5, salesRep: '张伟', status: '已交付' },
  { id: 2, date: '2026-08-02', region: '华北区', product: 'Enterprise Data Engine Pro', category: '数据中台', sales: 256000, units: 16, profitMargin: 52.0, salesRep: '李娜', status: '已交付' },
  { id: 3, date: '2026-08-03', region: '华南区', product: 'Smart Chart 自动化报表插件', category: '插件工具', sales: 48200, units: 120, profitMargin: 82.4, salesRep: '王强', status: '已交付' },
  { id: 4, date: '2026-08-04', region: '西南区', product: 'Cloud AI 智能数据分析终端', category: 'SaaS 软件', sales: 96000, units: 30, profitMargin: 65.0, salesRep: '赵敏', status: '进行中' },
  { id: 5, date: '2026-08-05', region: '华东区', product: 'BI 可视化分析看板 Suite', category: '数据中台', sales: 189000, units: 21, profitMargin: 61.2, salesRep: '张伟', status: '已交付' },
  { id: 6, date: '2026-08-06', region: '西北区', product: 'Smart Chart 自动化报表插件', category: '插件工具', sales: 19500, units: 50, profitMargin: 78.0, salesRep: '刘洋', status: '退款' },
  { id: 7, date: '2026-08-07', region: '华中区', product: 'Enterprise Data Engine Pro', category: '数据中台', sales: 310000, units: 19, profitMargin: 49.8, salesRep: '陈杰', status: '已交付' },
  { id: 8, date: '2026-08-08', region: '华东区', product: 'Cloud AI 智能数据分析终端', category: 'SaaS 软件', sales: 154000, units: 50, profitMargin: 70.1, salesRep: '孙婷', status: '已交付' },
  { id: 9, date: '2026-08-09', region: '华南区', product: 'BI 可视化分析看板 Suite', category: '数据中台', sales: 215000, units: 25, profitMargin: 63.5, salesRep: '王强', status: '进行中' },
  { id: 10, date: '2026-08-10', region: '华北区', product: 'Smart Chart 自动化报表插件', category: '插件工具', sales: 64000, units: 160, profitMargin: 84.0, salesRep: '李娜', status: '已交付' }
]

export const MOCK_METRICS: MetricCard[] = [
  {
    title: '总销售额 (Sales)',
    value: '¥ 1,480,200',
    change: '+14.2%',
    trend: 'up',
    tip: '较上期增加 ¥184,000'
  },
  {
    title: '成交订单数 (Orders)',
    value: '533 件',
    change: '+8.5%',
    trend: 'up',
    tip: '平均客单价 ¥2,777'
  },
  {
    title: '平均毛利率 (Profit)',
    value: '67.45%',
    change: '+3.1%',
    trend: 'up',
    tip: '插件工具贡献最高利润率'
  },
  {
    title: '主要风险区域 (Risk)',
    value: '西北区 (退款率 9.2%)',
    change: '-2.4%',
    trend: 'down',
    tip: '需重点关注西北区交付质量'
  }
]

export const MOCK_AI_INSIGHTS: AiInsight[] = [
  {
    id: 'ins-1',
    category: '洞察',
    title: '华东区贡献 31.8% 销售额，属于核心增长引擎',
    content: '通过对地区维度的交叉分析，华东区销售额达 47.15 万元，主要由「Cloud AI 智能数据分析终端」推动，客户续费意愿较强。',
    importance: 'high',
    tags: ['主力区域', '高续费']
  },
  {
    id: 'ins-2',
    category: '趋势',
    title: 'SaaS 软件类产品整体毛利率上升至 68.5%',
    content: '随着标准化模块发布，交付成本下降 12%，SaaS 产品线整体利润空间显著提高，建议加大市场推广投放。',
    importance: 'medium',
    tags: ['毛利提升', '成本优化']
  },
  {
    id: 'ins-3',
    category: '异常',
    title: '西北区订单退款比例达到 9.2%，高于平均线 2.1%',
    content: '检测到西北区近一月退款订单集中于「Smart Chart 插件」，主要反馈为兼容性配置问题，需安排技术支持介入。',
    importance: 'high',
    tags: ['售后预警', '产品兼容']
  },
  {
    id: 'ins-4',
    category: '建议',
    title: '针对中小型团队推出「数据中台 Lite 版」打法',
    content: '目前数据中台客单价最高但转化周期偏长（平均 28 天），建议拆分轻量级版本以缩短决策链路。',
    importance: 'medium',
    tags: ['产品策略', '转化率提升']
  }
]

export const MOCK_QUICK_PROMPTS: QuickPrompt[] = [
  { id: 1, icon: 'DataAnalysis', label: '分析各区域销售额占比', query: '请详细分析华东、华北、华南等各区域的销售额占比与贡献度。' },
  { id: 2, icon: 'TrendCharts', label: '找出利润率最高的产品', query: '本数据集中哪个产品分类的毛利率最高？原因是什么？' },
  { id: 3, icon: 'Warning', label: '诊断潜在退款异常风险', query: '帮我查找退款或异常订单集中在哪几个销售代表和地区。' },
  { id: 4, icon: 'PieChart', label: '预测下个季度销售策略', query: '根据当前销售数据，下季度应该重点推哪个产品线？' }
]

export const MOCK_TREND_DATA = {
  dates: ['8-01', '8-02', '8-03', '8-04', '8-05', '8-06', '8-07', '8-08', '8-09', '8-10'],
  sales: [128500, 256000, 48200, 96000, 189000, 19500, 310000, 154000, 215000, 64000],
  orders: [42, 16, 120, 30, 21, 50, 19, 50, 25, 160]
}

export const MOCK_REGION_DATA = [
  { name: '华东区', value: 471500 },
  { name: '华北区', value: 320000 },
  { name: '华南区', value: 263200 },
  { name: '华中区', value: 310000 },
  { name: '西南区', value: 96000 },
  { name: '西北区', value: 19500 }
]

