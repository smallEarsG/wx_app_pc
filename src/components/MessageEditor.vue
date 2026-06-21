<template>
  <div class="message-editor">
    <div class="editor-header" @click="toggleEditor">
      <span class="editor-title">{{ showEditor ? '收起编辑器' : '添加消息' }}</span>
      <span class="toggle-icon">{{ showEditor ? '▲' : '▼' }}</span>
    </div>

    <div v-if="showEditor" class="editor-content">
      <!-- 消息类型选择 -->
      <div class="form-row">
        <label class="form-label">消息类型</label>
        <el-select v-model="formData.contentType" placeholder="请选择消息类型" @change="handleTypeChange">
          <el-option label="文本消息" value="chat" />
          <el-option label="对外收款" value="order" />
          <el-option label="转账" value="transfer" />
          <el-option label="收款" value="wxtf" />
          <el-option label="图片消息" value="photo" />
          <el-option label="红包" value="redBag" />
          <el-option label="文件" value="file" />
          <el-option label="语音消息" value="yuyin" />
          <el-option label="名片" value="crad" />
          <el-option label="视频通话" value="video" />
          <el-option label="语音通话" value="phone" />
          <el-option label="提示" value="tips" />
        </el-select>
      </div>

      <!-- 消息来源切换 -->
      <div class="form-row">
        <label class="form-label">发送方</label>
        <div class="source-toggle">
          <span
            class="source-btn"
            :class="{ active: formData.location === 1 }"
            @click="formData.location = 1"
          >我</span>
          <span
            class="source-btn"
            :class="{ active: formData.location === 0 }"
            @click="formData.location = 0"
          >对方</span>
        </div>
      </div>

      <!-- 动态表单区域 -->
      <div class="form-row">
        <label class="form-label">{{ typeLabels[formData.contentType] }}</label>

        <!-- 文本消息 -->
        <template v-if="formData.contentType === 'chat'">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="2"
            placeholder="请输入消息内容"
          />
        </template>

        <!-- 对外收款 -->
        <template v-else-if="formData.contentType === 'order'">
          <el-input v-model="formData.shopName" placeholder="店铺名称" />
          <el-input v-model="formData.gusetName" placeholder="付款人" />
          <el-input v-model="formData.price" placeholder="金额" />
        </template>

        <!-- 转账 -->
        <template v-else-if="formData.contentType === 'transfer'">
          <el-input v-model="formData.name" placeholder="用户名" />
          <el-input v-model="formData.amount" placeholder="金额" />
          <el-input v-model="formData.tip" placeholder="提示信息" />
        </template>

        <!-- 收款 -->
        <template v-else-if="formData.contentType === 'wxtf'">
          <el-input v-model="formData.name" placeholder="用户名" />
          <el-input v-model="formData.amount" placeholder="金额" />
        </template>

        <!-- 图片消息 -->
        <template v-else-if="formData.contentType === 'photo'">
          <el-input v-model="formData.avatar" placeholder="图片链接" />
        </template>

        <!-- 红包 -->
        <template v-else-if="formData.contentType === 'redBag'">
          <span class="no-need-tip">无需填写内容</span>
        </template>

        <!-- 文件 -->
        <template v-else-if="formData.contentType === 'file'">
          <el-input v-model="formData.fileName" placeholder="文件名" />
          <el-input v-model="formData.fileSize" placeholder="文件大小（如：2.3MB）" />
        </template>

        <!-- 语音消息 -->
        <template v-else-if="formData.contentType === 'yuyin'">
          <el-input-number v-model="formData.time" :min="1" :max="3600" placeholder="时长（秒）" />
        </template>

        <!-- 名片 -->
        <template v-else-if="formData.contentType === 'crad'">
          <el-input v-model="formData.nickname" placeholder="昵称" />
        </template>

        <!-- 视频通话 -->
        <template v-else-if="formData.contentType === 'video'">
          <el-input v-model="formData.content" placeholder="通话时长（如：00:35）" />
        </template>

        <!-- 语音通话 -->
        <template v-else-if="formData.contentType === 'phone'">
          <el-input v-model="formData.content" placeholder="状态（如：已接听、已取消）" />
        </template>

        <!-- 提示 -->
        <template v-else-if="formData.contentType === 'tips'">
          <el-input v-model="formData.content" placeholder="提示内容" />
        </template>
      </div>

      <!-- 引用消息 -->
      <div class="form-row">
        <div class="quote-toggle" @click="showQuote = !showQuote">
          <span class="quote-icon">{{ showQuote ? '▼' : '▶' }}</span>
          <span>添加引用消息</span>
        </div>
        <div v-if="showQuote" class="quote-form">
          <el-input v-model="quoteData.fromName" placeholder="引用来源名称" />
          <el-select v-model="quoteData.fromLocation" placeholder="引用来源">
            <el-option label="对方" :value="0" />
            <el-option label="我方" :value="1" />
          </el-select>
          <el-select v-model="quoteData.contentType" placeholder="引用类型">
            <el-option label="文本消息" value="chat" />
            <el-option label="图片消息" value="photo" />
            <el-option label="文件" value="file" />
          </el-select>
          <el-input v-model="quoteData.previewText" type="textarea" :rows="2" placeholder="引用内容预览" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="resetForm">重置</el-button>
        <el-button type="primary" @click="insertMessage">插入消息</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { getContentTypeLabel } from '../utils/messageFormatter'
import type { MessageItem, QuoteInfo } from '../utils/messageFormatter'

const emit = defineEmits<{
  (e: 'insert', message: MessageItem): void
}>()

const showEditor = ref(false)
const showQuote = ref(false)

const typeLabels: Record<string, string> = {
  chat: '消息内容',
  order: '收款信息',
  transfer: '转账信息',
  wxtf: '收款信息',
  photo: '图片链接',
  redBag: '红包',
  file: '文件信息',
  yuyin: '语音时长',
  crad: '名片信息',
  video: '通话时长',
  phone: '通话状态',
  tips: '提示内容'
}

const formData = reactive({
  contentType: 'chat',
  location: 1,
  content: '',
  // 收款相关
  shopName: '',
  gusetName: '',
  price: '',
  // 转账相关
  name: '',
  amount: '',
  tip: '',
  // 图片相关
  avatar: '',
  // 文件相关
  fileName: '',
  fileSize: '',
  // 语音相关
  time: 0,
  // 名片相关
  nickname: ''
})

const quoteData = reactive({
  fromName: '',
  fromLocation: 0,
  contentType: 'chat',
  previewText: ''
})

const toggleEditor = () => {
  showEditor.value = !showEditor.value
}

const handleTypeChange = () => {
  // 切换类型时清空相关内容
  formData.content = ''
  formData.shopName = ''
  formData.gusetName = ''
  formData.price = ''
  formData.name = ''
  formData.amount = ''
  formData.tip = ''
  formData.avatar = ''
  formData.fileName = ''
  formData.fileSize = ''
  formData.time = 0
  formData.nickname = ''
}

const buildContent = (): unknown => {
  switch (formData.contentType) {
    case 'chat':
    case 'tips':
    case 'video':
    case 'phone':
      return formData.content

    case 'order':
      return {
        shopName: formData.shopName,
        gusetName: formData.gusetName,
        price: formData.price
      }

    case 'transfer':
      return {
        name: formData.name,
        amount: formData.amount,
        tip: formData.tip
      }

    case 'wxtf':
      return {
        name: formData.name,
        amount: formData.amount
      }

    case 'photo':
      return {
        avatar: formData.avatar
      }

    case 'redBag':
      return true

    case 'file':
      return {
        fileName: formData.fileName,
        fileSize: formData.fileSize,
        isCop: false
      }

    case 'yuyin':
      return {
        time: formData.time
      }

    case 'crad':
      return {
        nickname: formData.nickname,
        avatar: ''
      }

    default:
      return formData.content
  }
}

const buildQuote = (): QuoteInfo | undefined => {
  if (!showQuote.value || !quoteData.previewText) {
    return undefined
  }
  return {
    fromName: quoteData.fromName,
    fromLocation: quoteData.fromLocation,
    contentType: quoteData.contentType,
    previewText: quoteData.previewText
  }
}

const insertMessage = () => {
  const message: MessageItem = {
    type: formData.contentType === 'tips' ? 'tips' : 'content',
    contentType: formData.contentType,
    location: formData.location,
    content: buildContent(),
    quote: buildQuote()
  }

  emit('insert', message)
  resetForm()
}

const resetForm = () => {
  formData.contentType = 'chat'
  formData.location = 1
  formData.content = ''
  formData.shopName = ''
  formData.gusetName = ''
  formData.price = ''
  formData.name = ''
  formData.amount = ''
  formData.tip = ''
  formData.avatar = ''
  formData.fileName = ''
  formData.fileSize = ''
  formData.time = 0
  formData.nickname = ''
  showQuote.value = false
  quoteData.fromName = ''
  quoteData.fromLocation = 0
  quoteData.contentType = 'chat'
  quoteData.previewText = ''
}
</script>

<style scoped>
.message-editor {
  background-color: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background-color: #fff;
  transition: background-color 0.3s;
}

.editor-header:hover {
  background-color: #f5f7fa;
}

.editor-title {
  font-size: 14px;
  font-weight: 500;
  color: #409eff;
}

.toggle-icon {
  font-size: 12px;
  color: #909399;
}

.editor-content {
  padding: 16px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
}

.form-row {
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

/* 表单输入样式 */
.form-row :deep(.el-input),
.form-row :deep(.el-select),
.form-row :deep(.el-input-number) {
  margin-bottom: 8px;
  width: 100%;
}

.form-row :deep(.el-input:last-child),
.form-row :deep(.el-select:last-child),
.form-row :deep(.el-input-number:last-child) {
  margin-bottom: 0;
}

/* 发送方切换 */
.source-toggle {
  display: flex;
  gap: 8px;
}

.source-btn {
  flex: 1;
  padding: 8px 16px;
  text-align: center;
  font-size: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.source-btn:hover {
  border-color: #409eff;
}

.source-btn.active {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

/* 无需填写提示 */
.no-need-tip {
  color: #909399;
  font-size: 13px;
}

/* 引用切换 */
.quote-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
}

.quote-toggle:hover {
  color: #409eff;
}

.quote-icon {
  font-size: 10px;
}

.quote-form {
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.quote-form :deep(.el-input),
.quote-form :deep(.el-select) {
  margin-bottom: 8px;
  width: 100%;
}

.quote-form :deep(.el-input:last-child),
.quote-form :deep(.el-select:last-child) {
  margin-bottom: 0;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}
</style>
