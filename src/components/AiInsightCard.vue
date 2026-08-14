<template>
  <div class="insight-container app-card">
    <div class="insight-header">
      <div class="section-title">
        <el-icon color="#2563eb"><Cpu /></el-icon>
        <span>3. AI 智能洞察与分析报告</span>
      </div>
      <el-tag type="primary" effect="dark" round>AI Agent 模型: DeepSeek-R1 (Mock)</el-tag>
    </div>

    <!-- Metric KPI Grid -->
    <div class="metrics-grid">
      <div v-for="(metric, index) in metrics" :key="index" class="metric-card">
        <div class="metric-title-bar">
          <span class="metric-title">{{ metric.title }}</span>
          <el-tag 
            :type="metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'danger' : 'info'" 
            size="small" 
            effect="light"
          >
            {{ metric.change }}
          </el-tag>
        </div>
        <div class="metric-value">{{ metric.value }}</div>
        <div class="metric-tip">{{ metric.tip }}</div>
      </div>
    </div>

    <!-- Insights List -->
    <div class="insights-section">
      <div class="insights-subhead">
        <el-icon><Opportunity /></el-icon>
        <span>核心发现与诊断卡片</span>
      </div>

      <div class="insights-grid">
        <div 
          v-for="item in insights" 
          :key="item.id" 
          class="insight-item"
          :class="`category-${item.category}`"
        >
          <div class="item-header">
            <div class="category-badge">
              <el-tag :type="getCategoryType(item.category)" effect="dark" size="small">
                {{ item.category }}
              </el-tag>
              <span class="item-title">{{ item.title }}</span>
            </div>
            <el-tag 
              v-if="item.importance === 'high'" 
              type="danger" 
              effect="plain" 
              size="small"
            >
              重点关注
            </el-tag>
          </div>

          <p class="item-content">{{ item.content }}</p>

          <div class="item-footer">
            <div class="tags-group">
              <span v-for="tag in item.tags" :key="tag" class="insight-tag"># {{ tag }}</span>
            </div>
            <span class="timestamp">AI 实时推演</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Cpu, Opportunity } from '@element-plus/icons-vue'
import type { MetricCard, AiInsight } from '../types/excel'

defineProps<{
  metrics: MetricCard[]
  insights: AiInsight[]
}>()

const getCategoryType = (category: string) => {
  switch (category) {
    case '洞察': return 'primary'
    case '异常': return 'danger'
    case '建议': return 'warning'
    case '趋势': return 'success'
    default: return 'info'
  }
}
</script>

<style scoped>
.insight-container {
  padding: 24px;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* KPI Cards Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.metric-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-title {
  font-size: 0.8125rem;
  color: #64748b;
  font-weight: 500;
}

.metric-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 6px;
}

.metric-tip {
  font-size: 0.75rem;
  color: #94a3b8;
}

/* Insights Section */
.insights-subhead {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 14px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .insights-grid {
    grid-template-columns: 1fr;
  }
}

.insight-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #2563eb;
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.insight-item.category-异常 {
  border-left-color: #ef4444;
}

.insight-item.category-建议 {
  border-left-color: #f59e0b;
}

.insight-item.category-趋势 {
  border-left-color: #10b981;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.item-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
}

.item-content {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.6;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #f1f5f9;
}

.tags-group {
  display: flex;
  gap: 8px;
}

.insight-tag {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
}

.timestamp {
  font-size: 0.75rem;
  color: #cbd5e1;
}
</style>
