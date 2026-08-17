<template>
  <div class="chart-container app-card">
    <div class="chart-header">
      <div class="section-title">
        <el-icon color="#2563eb"><TrendCharts /></el-icon>
        <span>2.5 销售趋势与区域分布可视化看板</span>
      </div>

      <div class="chart-controls">
        <el-radio-group v-model="activeView" size="small" @change="handleViewChange">
          <el-radio-button label="trend">销售走势图</el-radio-button>
          <el-radio-button label="region">区域占比图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- Dual Charts Layout -->
    <div class="charts-grid">
      <!-- Main Line / Bar Trend Chart -->
      <div class="chart-box" :class="{ 'full-width': activeView === 'trend' }">
        <div class="box-title">{{ chartTitle }}</div>
        <div ref="lineChartRef" class="echarts-dom"></div>
      </div>

      <!-- Donut / Pie Share Chart -->
      <div v-show="activeView === 'region' || isDesktop" class="chart-box">
        <div class="box-title">各区域销售额贡献占比 (透视分析)</div>
        <div ref="pieChartRef" class="echarts-dom"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, shallowRef, watch } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { TrendChartData, RegionShareData } from '../types/excel'

const props = withDefaults(
  defineProps<{
    trendData?: TrendChartData
    regionData?: RegionShareData[]
    dateRangeText?: string
  }>(),
  {
    trendData: () => ({ dates: [], sales: [], orders: [], dateRangeText: '' }),
    regionData: () => [],
    dateRangeText: ''
  }
)

const activeView = ref<'trend' | 'region'>('trend')
const isDesktop = ref(true)

const lineChartRef = ref<HTMLDivElement | null>(null)
const pieChartRef = ref<HTMLDivElement | null>(null)

// Computed title reflecting dynamic date range
const chartTitle = computed(() => {
  const range = props.dateRangeText || props.trendData?.dateRangeText
  return range ? `日销售额与订单量走势 (${range})` : '日销售额与订单量走势'
})

// Use shallowRef for ECharts instances to prevent Vue reactivity proxies from interfering with ECharts internals
const lineChartInstance = shallowRef<echarts.ECharts | null>(null)
const pieChartInstance = shallowRef<echarts.ECharts | null>(null)

const initLineChart = () => {
  if (!lineChartRef.value) return

  if (!lineChartInstance.value) {
    lineChartInstance.value = echarts.init(lineChartRef.value)
  }

  const dates = props.trendData?.dates || []
  const sales = props.trendData?.sales || []
  const orders = props.trendData?.orders || []

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross', crossStyle: { color: '#999' } }
    },
    grid: {
      top: 40,
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    legend: {
      data: ['销售额 (元)', '订单量 (件)'],
      bottom: 0
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: { type: 'shadow' },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: {
          color: '#64748b',
          interval: dates.length > 15 ? 'auto' : 0,
          rotate: dates.length > 10 ? 30 : 0
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '销售额 (元)',
        axisLabel: {
          color: '#64748b',
          formatter: (value: number) => (value >= 10000 ? `¥${(value / 10000).toFixed(1)}万` : `¥${value.toLocaleString()}`)
        },
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
      },
      {
        type: 'value',
        name: '订单量',
        axisLabel: {
          color: '#64748b',
          formatter: '{value} 件'
        },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '销售额 (元)',
        type: 'line',
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3, color: '#2563eb' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(37, 99, 235, 0.35)' },
            { offset: 1, color: 'rgba(37, 99, 235, 0.02)' }
          ])
        },
        data: sales
      },
      {
        name: '订单量 (件)',
        type: 'bar',
        yAxisIndex: 1,
        barWidth: '24%',
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0]
        },
        data: orders
      }
    ]
  }

  lineChartInstance.value.setOption(option, true)
}

const initPieChart = () => {
  if (!pieChartRef.value) return

  if (!pieChartInstance.value) {
    pieChartInstance.value = echarts.init(pieChartRef.value)
  }

  const regionData = props.regionData || []

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      itemWidth: 10,
      itemHeight: 10,
      type: 'scroll'
    },
    series: [
      {
        name: '区域销售贡献',
        type: 'pie',
        radius: ['42%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: '#475569',
          fontSize: 12
        },
        color: ['#2563eb', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
        data: regionData
      }
    ]
  }

  pieChartInstance.value.setOption(option, true)
}

const handleResize = () => {
  lineChartInstance.value?.resize()
  pieChartInstance.value?.resize()
}

const handleViewChange = () => {
  setTimeout(() => {
    handleResize()
  }, 100)
}

watch(activeView, () => {
  handleViewChange()
})

watch(
  () => props.trendData,
  () => {
    initLineChart()
  },
  { deep: true }
)

watch(
  () => props.regionData,
  () => {
    initPieChart()
  },
  { deep: true }
)

onMounted(() => {
  initLineChart()
  initPieChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChartInstance.value?.dispose()
  pieChartInstance.value?.dispose()
})
</script>

<style scoped>
.chart-container {
  padding: 24px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
}

@media (max-width: 992px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}

.chart-box {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.chart-box.full-width {
  grid-column: span 2;
}

@media (max-width: 992px) {
  .chart-box.full-width {
    grid-column: span 1;
  }
}

.box-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 12px;
}

.echarts-dom {
  width: 100%;
  height: 320px;
}
</style>
