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
          placeholder="全局搜索数据内容..."
          prefix-icon="Search"
          clearable
          style="width: 240px;"
        />
        <el-select
          v-if="filterOptions.length > 0"
          v-model="selectedFilter"
          :placeholder="`筛选${filterColumnLabel}`"
          clearable
          style="width: 140px;"
        >
          <el-option
            v-for="opt in filterOptions"
            :key="opt"
            :label="opt"
            :value="opt"
          />
        </el-select>
      </div>
    </div>

    <!-- Dynamic Excel Table -->
    <el-table
      :data="filteredData"
      stripe
      border
      style="width: 100%"
      max-height="460"
      empty-text="暂无匹配数据"
    >
      <template v-for="col in displayColumns" :key="col.key">
        <!-- Status column special rendering -->
        <el-table-column
          v-if="isStatusColumn(col.key)"
          :prop="col.key"
          :label="col.label"
          :width="col.width || 100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="getStatusTagType(row[col.key])"
              size="small"
            >
              {{ row[col.key] }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Category / Tag column special rendering -->
        <el-table-column
          v-else-if="isCategoryColumn(col.key)"
          :prop="col.key"
          :label="col.label"
          :width="col.width || 120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row[col.key] }}</el-tag>
          </template>
        </el-table-column>

        <!-- Sales / Currency column special rendering -->
        <el-table-column
          v-else-if="isCurrencyColumn(col.key)"
          :prop="col.key"
          :label="col.label"
          :width="col.width || 130"
          align="right"
          sortable
        >
          <template #default="{ row }">
            <span class="sales-amount">{{ formatCurrency(row[col.key]) }}</span>
          </template>
        </el-table-column>

        <!-- Profit / Percentage column special rendering -->
        <el-table-column
          v-else-if="isPercentageColumn(col.key)"
          :prop="col.key"
          :label="col.label"
          :width="col.width || 110"
          align="right"
          sortable
        >
          <template #default="{ row }">
            <span :class="getProfitClass(row[col.key])">
              {{ formatPercentage(row[col.key]) }}
            </span>
          </template>
        </el-table-column>

        <!-- Default Dynamic Column -->
        <el-table-column
          v-else
          :prop="col.key"
          :label="col.label"
          :min-width="col.width || 110"
          :align="col.align || 'left'"
          sortable
          show-overflow-tooltip
        />
      </template>
    </el-table>

    <!-- Table Footer Stats -->
    <div class="table-footer">
      <span>
        当前数据筛选统计：已选 <strong>{{ filteredData.length }}</strong> 项（共 {{ data.length }} 行 · {{ displayColumns.length }} 列）
      </span>
      <span v-if="hasCurrencySum">
        阶段金额小计：<strong class="total-sales">¥ {{ totalSum.toLocaleString() }}</strong>
      </span>
      <span v-else>
        状态：<strong class="total-sales">正常解析就绪</strong>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'
import type { DynamicExcelRow } from '../types/excel'

const props = withDefaults(
  defineProps<{
    data: DynamicExcelRow[]
    columns?: string[]
  }>(),
  {
    data: () => [],
    columns: () => []
  }
)

const searchQuery = ref('')
const selectedFilter = ref('')

const COLUMN_LABEL_MAP: Record<string, string> = {
  id: '序号',
  __rowId: '序号',
  date: '日期',
  region: '地区',
  product: '产品名称',
  category: '分类',
  sales: '销售额 (元)',
  units: '销量 (件)',
  profitMargin: '毛利率',
  salesRep: '销售代表',
  status: '订单状态'
}

interface ColumnConfig {
  key: string
  label: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

// Compute display columns
const displayColumns = computed<ColumnConfig[]>(() => {
  let rawKeys: string[] = []

  if (props.columns && props.columns.length > 0) {
    rawKeys = props.columns
  } else if (props.data.length > 0) {
    rawKeys = Object.keys(props.data[0])
  }

  return rawKeys.map(key => {
    const label = COLUMN_LABEL_MAP[key] || key
    let width: number | undefined = undefined
    let align: 'left' | 'center' | 'right' = 'left'

    if (key === 'id' || key === '__rowId' || key === '序号') {
      width = 70
      align = 'center'
    } else if (key === 'date' || key === '日期') {
      width = 120
    } else if (key === 'region' || key === '地区') {
      width = 100
    } else if (key === 'product' || key === '产品名称' || key === '产品') {
      width = 200
    } else if (key === 'units' || key === '销量' || key === '数量') {
      width = 100
      align = 'center'
    } else if (key === 'salesRep' || key === '销售代表' || key === '负责人') {
      width = 100
    }

    return { key, label, width, align }
  })
})

// Check column types for tailored styling
const isStatusColumn = (key: string) => {
  return key === 'status' || key === '状态' || key === '订单状态'
}

const isCategoryColumn = (key: string) => {
  return key === 'category' || key === '分类' || key === '类别'
}

const isCurrencyColumn = (key: string) => {
  return key === 'sales' || key === '销售额' || key === '金额' || key === '销售额 (元)' || key === '收入'
}

const isPercentageColumn = (key: string) => {
  return key === 'profitMargin' || key === '毛利率' || key === '利润率' || key === '占比'
}

const getStatusTagType = (val: any) => {
  if (val === '已交付' || val === '成功' || val === 'Completed' || val === '已完成') return 'success'
  if (val === '进行中' || val === '处理中' || val === 'Pending') return 'warning'
  if (val === '退款' || val === '失败' || val === 'Cancelled' || val === '异常') return 'danger'
  return 'info'
}

const formatCurrency = (val: any) => {
  if (val === undefined || val === null || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return String(val)
  return `¥ ${num.toLocaleString()}`
}

const formatPercentage = (val: any) => {
  if (val === undefined || val === null || val === '') return '-'
  const strVal = String(val).trim()
  if (strVal.endsWith('%')) return strVal
  const num = Number(val)
  if (isNaN(num)) return strVal
  return `${num}%`
}

const getProfitClass = (val: any) => {
  const num = parseFloat(String(val))
  if (!isNaN(num) && num >= 70) return 'high-profit'
  return 'normal-profit'
}

// Find primary categorical column for filter dropdown (e.g. region / 地区 / 类别)
const filterKey = computed(() => {
  if (props.data.length === 0) return null
  const firstRow = props.data[0]
  if ('region' in firstRow) return 'region'
  if ('地区' in firstRow) return '地区'
  if ('category' in firstRow) return 'category'
  if ('分类' in firstRow) return '分类'
  return null
})

const filterColumnLabel = computed(() => {
  if (!filterKey.value) return '分类'
  return COLUMN_LABEL_MAP[filterKey.value] || filterKey.value
})

const filterOptions = computed(() => {
  if (!filterKey.value || props.data.length === 0) return []
  const set = new Set<string>()
  props.data.forEach(row => {
    const val = row[filterKey.value!]
    if (val !== undefined && val !== null && val !== '') {
      set.add(String(val))
    }
  })
  return Array.from(set)
})

// Filter data by search query and category/region selector
const filteredData = computed(() => {
  return props.data.filter(item => {
    // 1. Check dropdown filter
    if (selectedFilter.value && filterKey.value) {
      if (String(item[filterKey.value]) !== selectedFilter.value) {
        return false
      }
    }

    // 2. Global search query
    if (!searchQuery.value) return true
    const q = searchQuery.value.toLowerCase().trim()

    return Object.values(item).some(val => {
      if (val === undefined || val === null) return false
      return String(val).toLowerCase().includes(q)
    })
  })
})

// Summary calculation
const currencyKey = computed(() => {
  if (props.data.length === 0) return null
  const firstRow = props.data[0]
  if ('sales' in firstRow) return 'sales'
  if ('销售额' in firstRow) return '销售额'
  if ('金额' in firstRow) return '金额'
  if ('收入' in firstRow) return '收入'
  return null
})

const hasCurrencySum = computed(() => currencyKey.value !== null)

const totalSum = computed(() => {
  if (!currencyKey.value) return 0
  const key = currencyKey.value
  return filteredData.value.reduce((acc, curr) => {
    const num = Number(curr[key])
    return acc + (isNaN(num) ? 0 : num)
  }, 0)
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
  flex-wrap: wrap;
  gap: 8px;
}

.total-sales {
  color: #2563eb;
  font-size: 1rem;
}
</style>
