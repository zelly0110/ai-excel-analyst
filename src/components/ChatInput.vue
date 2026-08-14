<template>
  <div class="chat-container app-card">
    <div class="chat-header">
      <div class="section-title">
        <el-icon color="#2563eb"><ChatDotSquare /></el-icon>
        <span>4. AI 数据 Copilot 提问与分析对话</span>
      </div>
      <span class="chat-subtitle">输入任意针对当前 Excel 表格的问题，AI 将自动分析计算</span>
    </div>

    <!-- Quick Prompts Area -->
    <div class="quick-prompts">
      <span class="prompt-tip">快捷提问建议：</span>
      <div class="prompts-list">
        <el-button
          v-for="prompt in quickPrompts"
          :key="prompt.id"
          size="small"
          round
          type="info"
          plain
          class="prompt-btn"
          @click="handleSelectPrompt(prompt.query)"
        >
          <el-icon class="prompt-icon"><ChatLineRound /></el-icon>
          {{ prompt.label }}
        </el-button>
      </div>
    </div>

    <!-- Chat Stream / Response Area -->
    <div class="messages-box" ref="messagesBoxRef">
      <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.sender">
        <div class="avatar">
          <el-icon v-if="msg.sender === 'ai'" color="#ffffff"><Cpu /></el-icon>
          <el-icon v-else color="#ffffff"><User /></el-icon>
        </div>
        <div class="message-content-wrapper">
          <div class="message-sender-name">
            {{ msg.sender === 'ai' ? 'AI 数据分析助手' : '用户' }}
            <span class="time">{{ msg.timestamp }}</span>
          </div>
          <div class="message-bubble">
            <p>{{ msg.text }}</p>
          </div>
        </div>
      </div>

      <div v-if="isAiTyping" class="message-row ai">
        <div class="avatar">
          <el-icon color="#ffffff"><Cpu /></el-icon>
        </div>
        <div class="message-content-wrapper">
          <div class="message-sender-name">AI 数据分析助手</div>
          <div class="message-bubble typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="typing-text">AI 正在阅读表格并计算分析...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="input-bar">
      <el-input
        v-model="inputQuery"
        placeholder="提问示例：“帮我分析各部门的销售额占比” 或 “查找异常订单”..."
        size="large"
        clearable
        @keyup.enter="handleSend"
      >
        <template #append>
          <el-button 
            type="primary" 
            icon="Promotion" 
            :disabled="!inputQuery.trim() || isAiTyping"
            @click="handleSend"
          >
            发送提问
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ChatDotSquare, Cpu, User, ChatLineRound } from '@element-plus/icons-vue'
import type { QuickPrompt, ChatMessage } from '../types/excel'

defineProps<{
  quickPrompts: QuickPrompt[]
}>()

const inputQuery = ref('')
const isAiTyping = ref(false)
const messagesBoxRef = ref<HTMLElement | null>(null)

const messages = ref<ChatMessage[]>([
  {
    id: 'msg-init',
    sender: 'ai',
    text: '您好！我已经完成了 Excel 数据的初步扫描。您可以直接向我提问，例如查看各地区销售额对比、寻找利润率异常订单或分析下季销售趋势。',
    timestamp: '09:00'
  }
])

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesBoxRef.value) {
      messagesBoxRef.value.scrollTop = messagesBoxRef.value.scrollHeight
    }
  })
}

const handleSelectPrompt = (queryText: string) => {
  inputQuery.value = queryText
  handleSend()
}

const handleSend = () => {
  const query = inputQuery.value.trim()
  if (!query || isAiTyping.value) return

  const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  // User Message
  messages.value.push({
    id: `user-${Date.now()}`,
    sender: 'user',
    text: query,
    timestamp: now
  })

  inputQuery.value = ''
  isAiTyping.value = true
  scrollToBottom()

  // Simulated AI response after 1 second
  setTimeout(() => {
    isAiTyping.value = false
    
    let answerText = ''
    if (query.includes('区域') || query.includes('销售额')) {
      answerText = '【AI 计算结果】在当前 10 条数据中：华东区总销售额达 ¥471,500 (占比 31.8%) 排名第一；华中区单笔订金额最高 (¥310,000)；华北区订单频次居前。建议在华东区重点加大 SaaS 软件复购。'
    } else if (query.includes('利润率') || query.includes('最高')) {
      answerText = '【AI 计算结果】利润率最高的产品类别是「插件工具 (Smart Chart)」，平均毛利率高达 81.47%；SaaS 软件类次之 (67.8%)；数据中台平均毛利率为 55.1%。'
    } else if (query.includes('退款') || query.includes('风险')) {
      answerText = '【AI 风险预警】检测到西北区订单 (序号 6) 产生退款，涉及到销售代表刘洋。原因分析：该插件在某些环境存在初始化配置冲突，建议安排技术支持跟进补救。'
    } else {
      answerText = `【AI 数据解答】已根据表格透视分析您的提问「${query}」：基于当前 10 笔订单透视，整体增长动力强劲，整体毛利率稳定在 67.45%，现金流健康。`
    }

    messages.value.push({
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: answerText,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })
    scrollToBottom()
  }, 1200)
}
</script>

<style scoped>
.chat-container {
  padding: 24px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-subtitle {
  font-size: 0.8125rem;
  color: #64748b;
}

.quick-prompts {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  background: #f8fafc;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px dashed #cbd5e1;
}

.prompt-tip {
  font-size: 0.8125rem;
  color: #475569;
  font-weight: 500;
}

.prompts-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.prompt-btn {
  font-size: 0.8125rem;
  border-color: #cbd5e1;
  background: #ffffff;
}

.prompt-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.messages-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  min-height: 220px;
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

.message-row {
  display: flex;
  gap: 12px;
  max-width: 88%;
}

.message-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-row.ai {
  align-self: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-row.ai .avatar {
  background: #2563eb;
}

.message-row.user .avatar {
  background: #475569;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-row.user .message-content-wrapper {
  align-items: flex-end;
}

.message-sender-name {
  font-size: 0.75rem;
  color: #64748b;
  display: flex;
  gap: 8px;
}

.message-sender-name .time {
  color: #cbd5e1;
}

.message-bubble {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.875rem;
  color: #0f172a;
  line-height: 1.6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.message-row.user .message-bubble {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
  border-bottom-right-radius: 2px;
}

.message-row.ai .message-bubble {
  border-bottom-left-radius: 2px;
}

/* Typing animation */
.typing {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
}

.dot {
  width: 6px;
  height: 6px;
  background: #2563eb;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.typing-text {
  margin-left: 6px;
  font-size: 0.8125rem;
}

.input-bar {
  display: flex;
  gap: 12px;
}
</style>
