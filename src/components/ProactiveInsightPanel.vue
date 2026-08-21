<template>
  <div class="proactive-panel app-card">
    <!-- Header Area -->
    <div class="panel-header">
      <div class="header-left">
        <div class="section-title">
          <el-icon class="pulse-icon" color="#2563eb"><Cpu /></el-icon>
          <span>AI 主动发现</span>
        </div>
        <el-tag type="primary" effect="light" round class="insight-count-badge">
          检测到 {{ insights.length }} 条高价值洞察
        </el-tag>
      </div>

      <div class="header-right">
        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            全部 ({{ insights.length }})
          </button>
          <button
            v-if="warningCount > 0"
            class="tab-btn warning-tab"
            :class="{ active: activeFilter === 'warning' }"
            @click="activeFilter = 'warning'"
          >
            ⚠️ 风险 ({{ warningCount }})
          </button>
          <button
            v-if="opportunityCount > 0"
            class="tab-btn opportunity-tab"
            :class="{ active: activeFilter === 'opportunity' }"
            @click="activeFilter = 'opportunity'"
          >
            💡 机会 ({{ opportunityCount }})
          </button>
          <button
            v-if="trendCount > 0"
            class="tab-btn trend-tab"
            :class="{ active: activeFilter === 'trend' }"
            @click="activeFilter = 'trend'"
          >
            📈 趋势 ({{ trendCount }})
          </button>
        </div>

        <!-- Generate Business Daily Report Button -->
        <el-button
          size="small"
          type="success"
          round
          class="generate-report-btn"
          @click="emit('generate-report')"
        >
          <el-icon><DataAnalysis /></el-icon>
          <span>生成经营日报</span>
        </el-button>

        <!-- LLM Prompt Preview Button -->
        <el-button
          size="small"
          type="primary"
          plain
          round
          class="prompt-preview-btn"
          @click="showPromptModal = true"
        >
          <el-icon><Document /></el-icon>
          <span>转换为 LLM Prompt</span>
        </el-button>
      </div>
    </div>

    <!-- Data Analysis Summary Bar -->
    <div class="analysis-summary-bar">
      <div class="summary-item">
        <div class="summary-icon"><el-icon><Tickets /></el-icon></div>
        <div class="summary-info">
          <span class="summary-label">分析数据</span>
          <span class="summary-val"><b>{{ totalOrders }}</b> 条订单</span>
        </div>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-item">
        <div class="summary-icon"><el-icon><Calendar /></el-icon></div>
        <div class="summary-info">
          <span class="summary-label">时间范围</span>
          <span class="summary-val" :title="dateRangeText">{{ dateRangeText }}</span>
        </div>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-item">
        <div class="summary-icon"><el-icon><Location /></el-icon></div>
        <div class="summary-info">
          <span class="summary-label">覆盖区域</span>
          <span class="summary-val">{{ regionCountText }}</span>
        </div>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-item">
        <div class="summary-icon"><el-icon><User /></el-icon></div>
        <div class="summary-info">
          <span class="summary-label">销售人员</span>
          <span class="summary-val">{{ repCountText }}</span>
        </div>
      </div>

      <div class="summary-divider"></div>

      <div class="summary-item">
        <div class="summary-icon"><el-icon><DocumentChecked /></el-icon></div>
        <div class="summary-info">
          <span class="summary-label">数据来源</span>
          <span class="summary-val">
            <el-tag :type="isDemo ? 'info' : 'success'" size="small" effect="plain" round class="source-tag">
              {{ dataSourceText }}
            </el-tag>
          </span>
        </div>
      </div>
    </div>

    <!-- AI Proactive Announcement Banner -->
    <div class="ai-speech-banner">
      <div class="speech-avatar">
        <el-icon :size="20" color="#2563eb"><Compass /></el-icon>
      </div>
      <div class="speech-text">
        <span class="speech-highlight">智能分析助手：</span>
        已自动完成全表多维扫描，
        <template v-if="insights.length > 0">
          为您主动提炼了 <b>{{ insights.length }}</b> 个值得关注的经营要点
          <span v-if="warningCount > 0">（含 <b class="text-danger">{{ warningCount }}</b> 项预警）</span>。无需手动提问即可掌握全局：
        </template>
        <template v-else>
          暂未发现显著数据波动或异常指标。
        </template>
      </div>
    </div>

    <!-- Insights Grid -->
    <div v-if="filteredInsights.length > 0" class="cards-grid">
      <div
        v-for="(item, index) in filteredInsights"
        :key="index"
        class="insight-card"
        :class="`type-${item.type}`"
      >
        <!-- Card Header -->
        <div class="card-top">
          <div class="type-pill">
            <span class="type-emoji">{{ getTypeEmoji(item.type) }}</span>
            <span class="type-text">{{ getTypeText(item.type) }}</span>
          </div>

          <div v-if="item.metric" class="metric-callout">
            <span class="metric-label">关键指标</span>
            <span class="metric-num" :class="`text-${item.type}`">{{ item.metric }}</span>
          </div>
        </div>

        <!-- Card Title -->
        <h4 class="card-title">{{ item.title }}</h4>

        <!-- Card Description -->
        <p class="card-desc">{{ item.description }}</p>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="tags-container">
            <span v-for="tag in item.tags" :key="tag" class="tag-pill">
              # {{ tag }}
            </span>
          </div>
          <span class="rule-badge">规则引擎自动检测</span>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <el-icon :size="36" color="#94a3b8"><Opportunity /></el-icon>
      <p>当前分类下暂无主动发现的洞察项</p>
    </div>

    <!-- Future LLM Prompt Modal/Drawer -->
    <el-drawer
      v-model="showPromptModal"
      title="🤖 LLM 结构化 Prompt 导出 (DeepSeek / GPT / Gemini)"
      size="560px"
      direction="rtl"
    >
      <div class="drawer-content">
        <div class="drawer-tip">
          <p>
            当前主动洞察模块已将规则引擎检测出的事实、异常与机会格式化为结构化上下文，
            可一键复制并直接接入 <b>DeepSeek / GPT-4o / Gemini 1.5 Pro</b> 生成深度经营决策简报。
          </p>
        </div>

        <div class="prompt-code-wrapper">
          <div class="prompt-actions-bar">
            <span class="prompt-meta">Markdown 格式 · 包含 {{ insights.length }} 条事实洞察</span>
            <el-button size="small" type="primary" @click="handleCopyPrompt">
              <el-icon><CopyDocument /></el-icon>
              <span>一键复制 Prompt</span>
            </el-button>
          </div>
          <pre class="prompt-code">{{ generatedPromptText }}</pre>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Cpu,
  Opportunity,
  Document,
  CopyDocument,
  Compass,
  Tickets,
  Calendar,
  Location,
  User,
  DocumentChecked,
  DataAnalysis
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ProactiveInsight, DatasetAnalysisContext, DynamicExcelRow, ExcelFileMeta } from '../types/excel'
import { buildProactiveInsightsPrompt } from '../utils/insightEngine'

const props = withDefaults(
  defineProps<{
    insights: ProactiveInsight[]
    analysisContext?: DatasetAnalysisContext | null
    rawData?: DynamicExcelRow[]
    isDemo?: boolean
    fileMeta?: ExcelFileMeta | null
  }>(),
  {
    insights: () => [],
    analysisContext: null,
    rawData: () => [],
    isDemo: false,
    fileMeta: null
  }
)

const emit = defineEmits<{
  (e: 'generate-report'): void
}>()

const activeFilter = ref<'all' | 'warning' | 'opportunity' | 'trend'>('all')
const showPromptModal = ref(false)

const totalOrders = computed(() => {
  return props.analysisContext?.overview.totalOrders || props.rawData?.length || 0
})

const dateRangeText = computed(() => {
  if (!props.analysisContext?.dateTrend) return '暂无时间维度'
  const { startDate, endDate } = props.analysisContext.dateTrend
  if (!startDate && !endDate) return '暂无时间维度'
  if (startDate === endDate) return startDate
  return `${startDate} 至 ${endDate}`
})

const regionCountText = computed(() => {
  const count = props.analysisContext?.dimensions.byRegion?.length || 0
  return count > 0 ? `${count} 个` : '未指定'
})

const repCountText = computed(() => {
  const count = props.analysisContext?.dimensions.bySalesRep?.length || 0
  return count > 0 ? `${count} 人` : '全员协同'
})

const dataSourceText = computed(() => {
  if (props.isDemo) return '示例 Demo 数据'
  if (props.fileMeta?.fileName) return `真实 Excel (${props.fileMeta.fileName})`
  return '真实 Excel'
})

const warningCount = computed(() => props.insights.filter(i => i.type === 'warning').length)
const opportunityCount = computed(() => props.insights.filter(i => i.type === 'opportunity').length)
const trendCount = computed(() => props.insights.filter(i => i.type === 'trend').length)

const filteredInsights = computed(() => {
  if (activeFilter.value === 'all') {
    return props.insights
  }
  return props.insights.filter(i => i.type === activeFilter.value)
})

const generatedPromptText = computed(() => {
  if (!props.analysisContext) {
    return '暂无可用分析上下文'
  }
  return buildProactiveInsightsPrompt(props.insights, props.analysisContext)
})

const getTypeEmoji = (type: ProactiveInsight['type']) => {
  switch (type) {
    case 'opportunity': return '💡'
    case 'warning': return '⚠️'
    case 'trend': return '📈'
    default: return '🔍'
  }
}

const getTypeText = (type: ProactiveInsight['type']) => {
  switch (type) {
    case 'opportunity': return '业务机会'
    case 'warning': return '风险预警'
    case 'trend': return '趋势特征'
    default: return '数据洞察'
  }
}

const handleCopyPrompt = async () => {
  try {
    await navigator.clipboard.writeText(generatedPromptText.value)
    ElMessage.success('已复制 LLM Prompt 到剪贴板！可直接粘贴至 DeepSeek/ChatGPT 使用。')
  } catch (_e) {
    ElMessage.warning('复制失败，请手动选取文本复制')
  }
}
</script>

<style scoped>
.proactive-panel {
  padding: 24px;
  background: #ffffff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-icon {
  animation: pulse-glow 2.5s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.insight-count-badge {
  font-size: 0.8125rem;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 8px;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.8125rem;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  color: #0f172a;
}

.tab-btn.active {
  background: #ffffff;
  color: #2563eb;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.tab-btn.warning-tab.active {
  color: #dc2626;
}

.tab-btn.opportunity-tab.active {
  color: #059669;
}

.tab-btn.trend-tab.active {
  color: #2563eb;
}

.prompt-preview-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Data Analysis Summary Bar */
.analysis-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px 18px;
  margin-bottom: 16px;
  gap: 12px;
  overflow-x: auto;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.summary-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-label {
  font-size: 0.6875rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-val {
  font-size: 0.8125rem;
  color: #1e293b;
  font-weight: 600;
}

.summary-divider {
  width: 1px;
  height: 24px;
  background: #e2e8f0;
  flex-shrink: 0;
}

.source-tag {
  font-weight: 500;
  font-size: 0.75rem;
}

@media (max-width: 900px) {
  .analysis-summary-bar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .summary-divider {
    display: none;
  }
}

/* AI Announcement Speech Banner */
.ai-speech-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
}

.speech-avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #bfdbfe;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.speech-text {
  font-size: 0.875rem;
  color: #334155;
  line-height: 1.5;
}

.speech-highlight {
  font-weight: 600;
  color: #2563eb;
}

.text-danger {
  color: #ef4444;
}

/* Cards Grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  border-radius: 12px;
  padding: 18px 20px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

/* Theme variants */
.insight-card.type-warning {
  border-left: 4px solid #ef4444;
  background: linear-gradient(180deg, #fffafa 0%, #ffffff 100%);
}

.insight-card.type-warning:hover {
  border-color: #fca5a5;
  border-left-color: #ef4444;
}

.insight-card.type-opportunity {
  border-left: 4px solid #10b981;
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
}

.insight-card.type-opportunity:hover {
  border-color: #86efac;
  border-left-color: #10b981;
}

.insight-card.type-trend {
  border-left: 4px solid #3b82f6;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.insight-card.type-trend:hover {
  border-color: #93c5fd;
  border-left-color: #3b82f6;
}

/* Card Header */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
}

.type-warning .type-pill {
  background: #fee2e2;
  color: #b91c1c;
}

.type-opportunity .type-pill {
  background: #d1fae5;
  color: #047857;
}

.type-trend .type-pill {
  background: #dbeafe;
  color: #1d4ed8;
}

.metric-callout {
  display: flex;
  align-items: baseline;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 2px 10px;
  border-radius: 6px;
}

.metric-label {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.metric-num {
  font-size: 0.875rem;
  font-weight: 700;
}

.text-warning {
  color: #dc2626;
}

.text-opportunity {
  color: #059669;
}

.text-trend {
  color: #2563eb;
}

/* Card Content */
.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  margin: 2px 0 0 0;
}

.card-desc {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

/* Card Footer */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
  margin-top: 4px;
}

.tags-container {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-pill {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.rule-badge {
  font-size: 0.6875rem;
  color: #94a3b8;
}

/* Empty State */
.empty-state {
  padding: 40px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
  font-size: 0.875rem;
}

/* Drawer styles */
.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-tip {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 0.8125rem;
  color: #1e40af;
  line-height: 1.5;
}

.drawer-tip p {
  margin: 0;
}

.prompt-code-wrapper {
  background: #0f172a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #334155;
}

.prompt-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.prompt-meta {
  font-size: 0.75rem;
  color: #94a3b8;
}

.prompt-code {
  margin: 0;
  padding: 16px;
  color: #e2e8f0;
  font-family: 'Fira Code', Menlo, Monaco, Consolas, monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow-y: auto;
}
</style>
