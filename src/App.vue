<template>
  <div class="app-wrapper">
    <!-- Top Header -->
    <Header :is-data-loaded="isDataLoaded" />

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="content-container">
        
        <!-- Step 1: File Uploader Card -->
        <section class="section-block">
          <ExcelUploader
            :is-data-loaded="isDataLoaded"
            :loading="isLoadingDemo"
            @load-demo="handleLoadDemo"
            @reset="handleReset"
            @file-selected="handleFileSelected"
          />
        </section>

        <!-- Unloaded State Hero Banner -->
        <section v-if="!isDataLoaded" class="welcome-hero app-card">
          <div class="hero-icon">
            <el-icon :size="48" color="#2563eb"><DataAnalysis /></el-icon>
          </div>
          <h2>开启您的 AI 数据分析体验</h2>
          <p>
            只需点击上方<b>「加载示例销售数据」</b>或拖入本地 `.xlsx` 文件，
            AI 助手将自动完成表格解析、关键数据指标提取、生成诊断简报并开启自然语言交互。
          </p>
          <div class="feature-pills">
            <span class="pill"><el-icon><Check /></el-icon> 结构化数据明细提取</span>
            <span class="pill"><el-icon><Check /></el-icon> 自动化分析简报生成</span>
            <span class="pill"><el-icon><Check /></el-icon> 自然语言 Copilot 提问</span>
          </div>
        </section>

        <!-- Loaded State: Analysis & Data Views -->
        <template v-else>
          <!-- Step 2: Excel Data Preview Table -->
          <section class="section-block">
            <DataPreviewTable :data="excelData" />
          </section>

          <!-- Step 2.5: Sales Trend & Region Distribution ECharts -->
          <section class="section-block">
            <SalesTrendChart />
          </section>

          <!-- Step 3: AI Insights & Stat Cards -->
          <section class="section-block">
            <AiInsightCard :metrics="metrics" :insights="insights" />
          </section>

          <!-- Step 4: Natural Language AI Copilot Chat -->
          <section class="section-block">
            <ChatInput :quick-prompts="quickPrompts" />
          </section>
        </template>

      </div>
    </main>

    <!-- Footer -->
    <footer class="app-footer">
      <p>AI Excel 数据分析助手 MVP v0.1 · Day 1 极简版本 · Built with Vue 3, TypeScript & Element Plus</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { DataAnalysis, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import Header from './components/Header.vue'
import ExcelUploader from './components/ExcelUploader.vue'
import DataPreviewTable from './components/DataPreviewTable.vue'
import SalesTrendChart from './components/SalesTrendChart.vue'
import AiInsightCard from './components/AiInsightCard.vue'
import ChatInput from './components/ChatInput.vue'

import {
  MOCK_EXCEL_DATA,
  MOCK_METRICS,
  MOCK_AI_INSIGHTS,
  MOCK_QUICK_PROMPTS
} from './mocks/mockData'

import type { ExcelRow, MetricCard, AiInsight, QuickPrompt } from './types/excel'

const isDataLoaded = ref(false)
const isLoadingDemo = ref(false)

const excelData = ref<ExcelRow[]>([])
const metrics = ref<MetricCard[]>([])
const insights = ref<AiInsight[]>([])
const quickPrompts = ref<QuickPrompt[]>([])

const handleLoadDemo = () => {
  isLoadingDemo.value = true
  setTimeout(() => {
    excelData.value = MOCK_EXCEL_DATA
    metrics.value = MOCK_METRICS
    insights.value = MOCK_AI_INSIGHTS
    quickPrompts.value = MOCK_QUICK_PROMPTS
    
    isDataLoaded.value = true
    isLoadingDemo.value = false
    ElMessage.success('成功载入示例 Excel 销售数据！AI 已完成全自动洞察分析。')
  }, 600)
}

const handleReset = () => {
  isDataLoaded.value = false
  excelData.value = []
  metrics.value = []
  insights.value = []
  ElMessage.info('数据已重置')
}

const handleFileSelected = (_file: File) => {
  handleLoadDemo()
}
</script>

<style scoped>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

.main-content {
  flex: 1;
  padding: 24px 32px 48px 32px;
}

.content-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-block {
  width: 100%;
}

.welcome-hero {
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%);
}

.hero-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.welcome-hero h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.welcome-hero p {
  font-size: 0.95rem;
  color: #475569;
  max-width: 680px;
  line-height: 1.6;
}

.feature-pills {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.pill {
  font-size: 0.8125rem;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.app-footer {
  text-align: center;
  padding: 20px 32px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 0.8125rem;
  color: #94a3b8;
}
</style>
