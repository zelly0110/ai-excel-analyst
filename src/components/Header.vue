<template>
  <header class="app-header">
    <div class="header-container">
      <div class="brand">
        <div class="logo-icon">
          <el-icon :size="24" color="#2563eb"><DataLine /></el-icon>
        </div>
        <div class="title-group">
          <div class="main-title">
            <h1>AI Excel 数据分析助手</h1>
            <el-tag size="small" type="primary" effect="light" class="version-tag">MVP v0.1</el-tag>
          </div>
          <p class="subtitle">智能上传解析 · 自动生成数据洞察简报 · 自然语言问答对话</p>
        </div>
      </div>

      <div class="header-actions">
        <el-tag v-if="isDataLoaded" type="success" effect="plain" round class="status-tag">
          <el-icon><Check /></el-icon> 已就绪（{{ rowCount }} 条{{ isDemo ? '示例' : '' }}记录）
        </el-tag>
        <el-tag v-else type="info" effect="plain" round class="status-tag">
          <el-icon><InfoFilled /></el-icon> 尚未导入数据
        </el-tag>
        <el-button text type="primary" icon="QuestionFilled">操作指南</el-button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { DataLine, Check, InfoFilled } from '@element-plus/icons-vue'

interface Props {
  isDataLoaded: boolean
  rowCount?: number
  isDemo?: boolean
}

withDefaults(defineProps<Props>(), {
  rowCount: 0,
  isDemo: false
})
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 32px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #eff6ff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dbeafe;
}

.title-group {
  display: flex;
  flex-direction: column;
}

.main-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.main-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.01em;
}

.version-tag {
  font-weight: 600;
}

.subtitle {
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-tag {
  font-size: 0.8125rem;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
