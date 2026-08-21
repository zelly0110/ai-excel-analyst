<template>
  <div class="report-card app-card" id="business-report-section">
    <!-- Report Top Header -->
    <div class="report-header">
      <div class="header-main">
        <div class="report-title-badge">
          <div class="title-icon">
            <el-icon :size="24" color="#ffffff"><DataAnalysis /></el-icon>
          </div>
          <div class="title-text-group">
            <div class="title-row">
              <h3 class="report-title">AI 商业经营决策日报</h3>
              <el-tag type="success" effect="dark" round size="small" class="report-badge">
                正式简报
              </el-tag>
            </div>
            <p class="report-subtitle">全维度自动化聚合分析 · 基于真实底层数据生成</p>
          </div>
        </div>

        <div class="header-actions">
          <el-button
            type="primary"
            plain
            round
            size="default"
            class="action-btn"
            @click="handleCopyReport"
          >
            <el-icon><CopyDocument /></el-icon>
            <span>一键复制全文</span>
          </el-button>

          <el-button
            type="info"
            plain
            round
            size="default"
            class="action-btn"
            @click="showPromptDrawer = true"
          >
            <el-icon><Document /></el-icon>
            <span>导出为 LLM Prompt</span>
          </el-button>
        </div>
      </div>

      <!-- Report Metadata Strip -->
      <div class="report-meta-strip">
        <div class="meta-item">
          <el-icon class="meta-icon" color="#2563eb"><Tickets /></el-icon>
          <span class="meta-label">数据范围:</span>
          <span class="meta-value"><b>{{ report.totalOrders }}</b> 条订单</span>
        </div>

        <div class="meta-divider"></div>

        <div class="meta-item">
          <el-icon class="meta-icon" color="#2563eb"><Calendar /></el-icon>
          <span class="meta-label">时间范围:</span>
          <span class="meta-value">{{ report.dateRange }}</span>
        </div>

        <div class="meta-divider"></div>

        <div class="meta-item">
          <el-icon class="meta-icon" color="#2563eb"><Timer /></el-icon>
          <span class="meta-label">生成时间:</span>
          <span class="meta-value">{{ report.generatedAt }}</span>
        </div>

        <div class="meta-divider"></div>

        <div class="meta-item">
          <el-icon class="meta-icon" color="#10b981"><DocumentChecked /></el-icon>
          <span class="meta-label">数据来源:</span>
          <span class="meta-value">
            <el-tag :type="isDemo ? 'info' : 'success'" size="small" effect="plain" round>
              {{ dataSourceText }}
            </el-tag>
          </span>
        </div>
      </div>
    </div>

    <!-- Section 1: 📊 今日经营概览 (Overview) -->
    <section class="report-section">
      <div class="section-heading">
        <div class="heading-left">
          <span class="heading-emoji">📊</span>
          <h4 class="heading-title">今日经营概览</h4>
        </div>
        <span class="heading-tip">核心业务指标聚合</span>
      </div>

      <!-- KPI Metrics Cards Grid -->
      <div class="kpi-grid">
        <div
          v-for="(metric, idx) in report.keyMetrics"
          :key="idx"
          class="kpi-item"
        >
          <div class="kpi-top">
            <span class="kpi-label">{{ metric.label }}</span>
            <el-tag
              :type="metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'danger' : 'info'"
              size="small"
              effect="light"
            >
              {{ metric.change }}
            </el-tag>
          </div>
          <div class="kpi-value">{{ metric.value }}</div>
          <div class="kpi-tip">{{ metric.tip }}</div>
        </div>
      </div>

      <!-- Executive Summary Box -->
      <div class="summary-box">
        <div class="summary-header">
          <el-icon color="#2563eb"><Opportunity /></el-icon>
          <span>经营摘要速览 (Executive Summary)</span>
        </div>
        <p class="summary-content">{{ report.summary }}</p>
      </div>
    </section>

    <!-- Section 2: 🔥 核心表现 (Highlights) -->
    <section class="report-section">
      <div class="section-heading">
        <div class="heading-left">
          <span class="heading-emoji">🔥</span>
          <h4 class="heading-title">核心表现 (Highlights)</h4>
        </div>
        <span class="heading-tag count-badge">{{ report.highlights.length }} 项领跑特征</span>
      </div>

      <div class="items-grid highlights-grid">
        <div
          v-for="item in report.highlights"
          :key="item.id || item.title"
          class="detail-card highlight-card"
        >
          <div class="card-header-bar">
            <div class="tag-with-title">
              <span class="card-badge badge-highlight">{{ item.tag || '核心表现' }}</span>
              <h5 class="card-title">{{ item.title }}</h5>
            </div>
            <span v-if="item.metric" class="card-metric-callout highlight-metric">
              {{ item.metric }}
            </span>
          </div>
          <p class="card-desc">{{ item.detail }}</p>
        </div>
      </div>
    </section>

    <!-- Section 3: ⚠️ 风险提醒 (Risks) -->
    <section class="report-section" v-if="report.risks.length > 0">
      <div class="section-heading">
        <div class="heading-left">
          <span class="heading-emoji">⚠️</span>
          <h4 class="heading-title">风险提醒 (Risk Alerts)</h4>
        </div>
        <span class="heading-tag count-badge-danger">{{ report.risks.length }} 项需关注异动</span>
      </div>

      <div class="items-grid risks-grid">
        <div
          v-for="item in report.risks"
          :key="item.id || item.title"
          class="detail-card risk-card"
        >
          <div class="card-header-bar">
            <div class="tag-with-title">
              <span class="card-badge badge-risk">{{ item.tag || '风险预警' }}</span>
              <h5 class="card-title">{{ item.title }}</h5>
            </div>
            <span v-if="item.metric" class="card-metric-callout risk-metric">
              {{ item.metric }}
            </span>
          </div>
          <p class="card-desc">{{ item.detail }}</p>
        </div>
      </div>
    </section>

    <!-- Section 4: 💡 AI 建议 (Actionable Suggestions) -->
    <section class="report-section" v-if="report.suggestions.length > 0">
      <div class="section-heading">
        <div class="heading-left">
          <span class="heading-emoji">💡</span>
          <h4 class="heading-title">AI 经营建议 (Actionable Suggestions)</h4>
        </div>
        <span class="heading-tag count-badge-sug">{{ report.suggestions.length }} 条管理决策建议</span>
      </div>

      <div class="suggestions-list">
        <div
          v-for="(item, index) in report.suggestions"
          :key="item.id || index"
          class="suggestion-item"
        >
          <div class="sug-index">{{ index + 1 }}</div>
          <div class="sug-content">
            <div class="sug-title-row">
              <span class="sug-title">{{ item.title }}</span>
              <el-tag v-if="item.tag" size="small" effect="plain" type="warning">
                {{ item.tag }}
              </el-tag>
            </div>
            <p class="sug-detail">{{ item.detail }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- LLM Prompt Drawer -->
    <el-drawer
      v-model="showPromptDrawer"
      title="🤖 经营日报 LLM Prompt 导出 (DeepSeek / GPT / Gemini)"
      size="600px"
      direction="rtl"
    >
      <div class="drawer-content">
        <div class="drawer-tip">
          <p>
            已将完整经营日报结构（概览、表现、风险、管理建议）整合为标准 Prompt，
            可直接复制并输入至 <b>DeepSeek / GPT-4o / Gemini 1.5 Pro</b> 获得更高阶的战略汇报或 PPT 演讲稿。
          </p>
        </div>

        <div class="prompt-code-wrapper">
          <div class="prompt-actions-bar">
            <span class="prompt-meta">结构化 Markdown Prompt</span>
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
  DataAnalysis,
  Tickets,
  Calendar,
  Timer,
  DocumentChecked,
  CopyDocument,
  Document,
  Opportunity
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { BusinessReport, DatasetAnalysisContext, ExcelFileMeta } from '../types/excel'
import {
  formatBusinessReportToMarkdown,
  formatBusinessReportToPrompt
} from '../utils/reportGenerator'

const props = withDefaults(
  defineProps<{
    report: BusinessReport
    context?: DatasetAnalysisContext | null
    isDemo?: boolean
    fileMeta?: ExcelFileMeta | null
  }>(),
  {
    isDemo: false,
    fileMeta: null
  }
)

const showPromptDrawer = ref(false)

const dataSourceText = computed(() => {
  if (props.isDemo) return '示例 Demo 数据'
  if (props.fileMeta?.fileName) return `真实 Excel (${props.fileMeta.fileName})`
  return '真实 Excel 上传'
})

const generatedPromptText = computed(() => {
  if (!props.context) {
    return formatBusinessReportToMarkdown(props.report)
  }
  return formatBusinessReportToPrompt(props.report, props.context)
})

const handleCopyReport = async () => {
  try {
    const md = formatBusinessReportToMarkdown(props.report)
    await navigator.clipboard.writeText(md)
    ElMessage.success('已复制完整「AI 经营日报」至剪贴板！可直接粘贴至飞书/微信/邮件发送。')
  } catch (_e) {
    ElMessage.warning('复制失败，请手动选取内容复制')
  }
}

const handleCopyPrompt = async () => {
  try {
    await navigator.clipboard.writeText(generatedPromptText.value)
    ElMessage.success('已复制 LLM Prompt 到剪贴板！可直接粘贴至 DeepSeek/ChatGPT 使用。')
  } catch (_e) {
    ElMessage.warning('复制失败，请手动选取内容复制')
  }
}
</script>

<style scoped>
.report-card {
  padding: 28px 32px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

/* Header Area */
.report-header {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 18px;
}

.report-title-badge {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.report-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

/* Meta Strip */
.report-meta-strip {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 10px 18px;
  border-radius: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8125rem;
}

.meta-icon {
  font-size: 0.9375rem;
}

.meta-label {
  color: #64748b;
}

.meta-value {
  color: #1e293b;
}

.meta-divider {
  width: 1px;
  height: 16px;
  background: #cbd5e1;
}

/* Sections */
.report-section {
  margin-bottom: 32px;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.heading-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.heading-emoji {
  font-size: 1.25rem;
}

.heading-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.heading-tip {
  font-size: 0.75rem;
  color: #94a3b8;
}

.heading-tag {
  font-size: 0.75rem;
  padding: 2px 10px;
  border-radius: 20px;
  font-weight: 500;
}

.count-badge {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.count-badge-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.count-badge-sug {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

/* KPI Cards */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.kpi-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-label {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.kpi-tip {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Summary Box */
.summary-box {
  background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
  border: 1px solid #bbf7d0;
  border-left: 4px solid #10b981;
  border-radius: 10px;
  padding: 16px 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 8px;
}

.summary-content {
  font-size: 0.875rem;
  color: #334155;
  line-height: 1.65;
  margin: 0;
}

/* Items Grid (Highlights & Risks) */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .items-grid {
    grid-template-columns: 1fr;
  }
}

.detail-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.detail-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
}

.highlight-card {
  border-left: 4px solid #10b981;
}

.risk-card {
  border-left: 4px solid #ef4444;
}

.card-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.tag-with-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  width: fit-content;
}

.badge-highlight {
  background: #dcfce7;
  color: #15803d;
}

.badge-risk {
  background: #fee2e2;
  color: #b91c1c;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  line-height: 1.4;
}

.card-metric-callout {
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
}

.highlight-metric {
  background: #f0fdf4;
  color: #059669;
  border: 1px solid #bbf7d0;
}

.risk-metric {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.card-desc {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

/* Suggestions List */
.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background: #f1f5f9;
}

.sug-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #2563eb;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.8125rem;
  flex-shrink: 0;
}

.sug-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sug-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.sug-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.sug-detail {
  font-size: 0.8125rem;
  color: #475569;
  line-height: 1.6;
  margin: 0;
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
