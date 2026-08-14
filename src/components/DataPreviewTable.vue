<template>
  <div class="table-container app-card">
    <div class="table-header">
      <div class="title-with-badge">
        <div class="section-title">
          <el-icon color="#2563eb"><Grid /></el-icon>
          <span>2. 原始数据提取表 (Data Table)</span>
        </div>
        <el-tag type="info" size="small">{{ filteredData.length }} / {{ data.length }} 条记录</el-tag>
      </div>

      <div class="table-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索产品、地区、销售代表..."
          prefix-icon="Search"
          clearable
          style="width: 260px;"
        />
        <el-select v-model="regionFilter" placeholder="筛选地区" clearable style="width: 130px;">
          <el-option label="华东区" value="华东区" />
          <el-option label="华北区" value="华北区" />
          <el-option label="华南区" value="华南区" />
          <el-option label="西南区" value="西南区" />
          <el-option label="西北区" value="西北区" />
          <el-option label="华中区" value="华中区" />
        </el-select>
      </div>
    </div>

    <!-- Table -->
    <el-table
      :data="filteredData"
      stripe
      border
      style="width: 100%"
      max-height="420"
      empty-text="暂无匹配数据"
    >
      <el-table-column prop="id" label="序号" width="70" align="center" />
      <el-table-column prop="date" label="日期" width="110" sortable />
      <el-table-column prop="region" label="地区" width="100" />
      <el-table-column prop="product" label="产品名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="110">
        <template #default="{ row }">
          <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sales" label="销售额 (元)" width="130" align="right" sortable>
        <template #default="{ row }">
          <span class="sales-amount">¥ {{ row.sales.toLocaleString() }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="units" label="销量 (件)" width="100" align="center" sortable />
      <el-table-column prop="profitMargin" label="毛利率" width="110" align="right" sortable>
        <template #default="{ row }">
          <span :class="row.profitMargin >= 70 ? 'high-profit' : 'normal-profit'">
            {{ row.profitMargin }}%
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="salesRep" label="销售代表" width="100" />
      <el-table-column prop="status" label="订单状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.status === '已交付' ? 'success' : row.status === '进行中' ? 'warning' : 'danger'"
            size="small"
          >
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- Table Footer Stats -->
    <div class="table-footer">
      <span>当前数据筛选统计：已选 <strong>{{ filteredData.length }}</strong> 项</span>
      <span>阶段销售小计：<strong class="total-sales">¥ {{ totalSales.toLocaleString() }}</strong></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'
import type { ExcelRow } from '../types/excel'

const props = defineProps<{
  data: ExcelRow[]
}>()

const searchQuery = ref('')
const regionFilter = ref('')

const filteredData = computed(() => {
  return props.data.filter(item => {
    const matchesSearch = 
      !searchQuery.value ||
      item.product.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.region.includes(searchQuery.value) ||
      item.salesRep.includes(searchQuery.value) ||
      item.category.includes(searchQuery.value)
    
    const matchesRegion = !regionFilter.value || item.region === regionFilter.value

    return matchesSearch && matchesRegion
  })
})

const totalSales = computed(() => {
  return filteredData.value.reduce((acc, curr) => acc + curr.sales, 0)
})
</script>

<style scoped>
.table-container {
  padding: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.sales-amount {
  font-family: monospace;
  font-weight: 600;
  color: #0f172a;
}

.high-profit {
  color: #16a34a;
  font-weight: 600;
}

.normal-profit {
  color: #334155;
}

.table-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #64748b;
}

.total-sales {
  color: #2563eb;
  font-size: 1rem;
}
</style>
