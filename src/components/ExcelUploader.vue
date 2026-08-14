<template>
  <div class="uploader-container app-card">
    <div class="uploader-header">
      <div class="section-title">
        <el-icon color="#2563eb"><UploadFilled /></el-icon>
        <span>1. Excel 数据源载入</span>
      </div>
      <div class="uploader-actions">
        <el-button 
          type="primary" 
          plain 
          icon="MagicStick" 
          @click="$emit('load-demo')"
          :loading="loading"
        >
          加载示例销售数据 (Demo)
        </el-button>
        <el-button 
          v-if="isDataLoaded" 
          type="danger" 
          link 
          icon="Delete" 
          @click="$emit('reset')"
        >
          清空数据
        </el-button>
      </div>
    </div>

    <!-- Active Loaded State -->
    <div v-if="isDataLoaded" class="loaded-banner">
      <div class="file-info">
        <div class="file-icon">
          <el-icon :size="28" color="#10b981"><DocumentChecked /></el-icon>
        </div>
        <div class="file-meta">
          <span class="file-name">2026_Q3_Sales_Report_Demo.xlsx</span>
          <span class="file-detail">已读取 10 条有效记录 · 10 列维度数据 · 状态: 正常解析</span>
        </div>
      </div>
      <el-tag type="success" size="large" effect="dark" round>已成功加载分析源</el-tag>
    </div>

    <!-- Upload Dropzone -->
    <el-upload
      v-else
      class="upload-drag-area"
      drag
      action="#"
      :auto-upload="false"
      :on-change="handleFileChange"
      accept=".xlsx, .xls, .csv"
    >
      <el-icon class="el-icon--upload" :size="48"><upload-filled /></el-icon>
      <div class="el-upload__text">
        将 Excel 文件拖到此处，或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="upload-tip">
          支持 .xlsx, .xls, .csv 格式文件 (单文件小于 20MB)。点击上方的「加载示例销售数据」可直接体验 MVP。
        </div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { UploadFilled, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'

defineProps<{
  isDataLoaded: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'load-demo'): void
  (e: 'reset'): void
  (e: 'file-selected', file: File): void
}>()

const handleFileChange = (uploadFile: UploadFile) => {
  if (uploadFile.raw) {
    ElMessage.success(`已选择文件: ${uploadFile.name}，正在生成 Mock 演示数据...`)
    emit('file-selected', uploadFile.raw)
  }
}
</script>

<style scoped>
.uploader-container {
  padding: 24px;
}

.uploader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upload-drag-area {
  width: 100%;
}

:deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  background-color: #f8fafc;
  padding: 32px 20px;
  transition: all 0.2s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #2563eb;
  background-color: #eff6ff;
}

.upload-tip {
  margin-top: 12px;
  font-size: 0.8125rem;
  color: #64748b;
  text-align: center;
}

.loaded-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.file-icon {
  width: 48px;
  height: 48px;
  background: #ffffff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dcfce7;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.file-detail {
  font-size: 0.8125rem;
  color: #166534;
}
</style>
