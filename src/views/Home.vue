<template>
  <div class="home-container">
    <header class="home-header">
      <h1>销售模板生成器</h1>
      <div class="user-info">
        <div class="user-detail">
          <div class="user-phone">{{ userStore.getUser?.phone || '用户' }}</div>
          <div class="member-status" :class="{ 'member-active': userStore.getIsMember }">
            {{ userStore.getIsMember ? `会员（${formatMemberExpireAt}到期）` : '非会员' }}
          </div>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </header>
    <main class="home-main">
      <div class="control-split">
        <div class="control-split-left">
          <div class="panel-header">
            <h3 class="panel-title">会话列表</h3>
          </div>
          <div class="list-header">
            <el-checkbox :indeterminate="isIndeterminate" :model-value="isAllSelected" @change="handleSelectAll">全选</el-checkbox>
          </div>
          <el-list v-loading="loading" :data="conversations" class="conversation-list">
            <el-list-item v-for="item in conversations" :key="item.conversationId" @click="selectConversation(item)" @dblclick.stop="openRemarkModal(item)" :class="{ 'active': selectedId === item.conversationId }">
              <template #default>
                <div class="conversation-item">
                  <el-checkbox v-model="item._selected" @change="(val: boolean) => handleSelectItem(item.conversationId, val)" @click.stop></el-checkbox>
                  <div class="avatar-wrapper">
                    <el-avatar :src="item.avatarUrl" class="conversation-avatar">
                      <span class="avatar-text">{{ item.name?.charAt(0) || '?' }}</span>
                    </el-avatar>
                    <span v-if="item.unreadCount && item.unreadCount > 0" class="unread-badge">{{ item.unreadCount }}</span>
                  </div>
                  <div class="conversation-content">
                    <div class="conversation-header">
                      <span class="conversation-name">{{ item.name }}</span>
                      <span v-if="item.remark" class="remark-ellipsis">({{ item.remark }})</span>
                    </div>
                  </div>
                  <div class="conversation-time">{{ item.createdAt }}</div>
                </div>
              </template>
            </el-list-item>
          </el-list>
        </div>
        <div class="control-split-right">
          <div class="panel-header">
            <h3 class="panel-title">消息编辑</h3>
          </div>
          <div v-if="selectedConversation" class="message-content-section">
            <div ref="messageListRef" v-if="formattedMessages.length > 0" class="message-list">
              <div v-for="(msg, index) in formattedMessages" :key="index">
                <div v-if="msg.type === 'tips'" class="message-tip">
                  <span class="tip-tag">{{ msg.label }}</span>
                  <span class="tip-content">{{ msg.content }}</span>
                </div>
                <template v-else>
                  <div class="message-item" :class="{ 'message-self': msg.from === '我', 'message-other': msg.from === '对方' }">
                    <div v-if="msg.from === '对方'" class="message-avatar">
                      <div class="avatar" :style="{ background: getAvatarColor(msg.from) }">{{ msg.from?.charAt(0) }}</div>
                    </div>
                    <div class="message-content-wrapper">
                      <div v-if="msg.from" class="message-sender">{{ msg.from }}</div>
                      <div class="message-bubble">
                        <span class="message-tag" v-if="msg.label">{{ msg.label }}</span>
                        <div v-if="msg.label === '图片消息'" :key="'img-' + index">
                          <div v-if="editingIndex === index" class="message-edit">
                            <input ref="editInputRef" v-model="editingContent" class="edit-input" @keydown="handleKeydown" @blur="handleBlur" />
                          </div>
                          <div v-else class="image-message-container">
                            <img :src="msg.imageUrl" alt="图片消息" class="message-image" @dblclick="handleMessageImageDoubleClick(index)" />
                            <span class="image-tip">双击替换图片</span>
                          </div>
                        </div>
                        <div v-else :key="'text-' + index">
                          <div v-if="editingIndex === index" class="message-edit">
                            <input ref="editInputRef" v-model="editingContent" class="edit-input" @keydown="handleKeydown" @blur="handleBlur" />
                          </div>
                          <p v-else class="message-text" @dblclick="handleDoubleClick(index)">{{ msg.content }}</p>
                        </div>
                        <div v-if="msg.quote" class="quote-box">
                          <p class="quote-header">引用消息 ({{ msg.quote.from }})</p>
                          <p class="quote-type">类型: {{ msg.quote.type }}</p>
                          <p class="quote-text">{{ msg.quote.text }}</p>
                        </div>
                      </div>
                    </div>
                    <div v-if="msg.from === '我'" class="message-avatar">
                      <div class="avatar" :style="{ background: getAvatarColor(msg.from) }">{{ msg.from?.charAt(0) }}</div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <p v-else class="no-content">暂无内容</p>
          </div>
          <div v-else class="no-conversation">
            <p>请选择一个会话查看详情</p>
          </div>
          <MessageEditor @insert="handleInsertMessage" />
        </div>
        <div class="right-panel">
          <div class="panel-header">
            <h3 class="panel-title">工具栏</h3>
          </div>
          <div class="control-toolbar">
            <button class="control-btn" :disabled="selectedIds.length === 0" @click="openBatchEditModal">批量编辑</button>
            <button class="control-btn" :disabled="selectedIds.length === 0" @click="openBatchInsertModal">批量插入消息</button>
            <button class="control-btn" :disabled="selectedIds.length === 0" @click="saveSelectedConversations">保存选中</button>
          </div>
          <div class="quick-messages-panel">
            <div class="quick-messages-header">
              <span class="quick-messages-title">快捷消息</span>
              <button class="add-quick-msg-btn" @click="openAddQuickMessageModal">+ 新增</button>
            </div>
            <div class="quick-messages-list" v-loading="quickMessagesLoading">
              <div v-for="msg in quickMessages" :key="msg.id" class="quick-message-item" @click="insertQuickMessage(msg)">
                <span class="quick-msg-type" :class="msg.messageType">{{ msg.messageType === 'text' ? '文本' : '图片' }}</span>
                <span class="quick-msg-content">{{ msg.messageType === 'image' ? '[图片]' : msg.messageContent }}</span>
                <span class="quick-msg-delete" @click.stop="deleteQuickMessage(msg.id)" title="删除">×</span>
              </div>
              <p v-if="quickMessages.length === 0" class="no-quick-messages">暂无快捷消息</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <el-dialog title="新增快捷消息" v-model="addQuickMessageVisible" width="450px" @close="resetQuickMessageForm">
        <el-form :model="quickMessageForm" label-width="80px">
          <el-form-item label="消息类型">
            <el-radio-group v-model="quickMessageForm.messageType">
              <el-radio value="text">文本</el-radio>
              <el-radio value="image">图片</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="消息内容" v-if="quickMessageForm.messageType === 'text'">
            <el-input v-model="quickMessageForm.messageContent" type="textarea" :rows="3" placeholder="请输入消息内容" />
          </el-form-item>
          <el-form-item label="图片链接" v-else>
            <el-input v-model="quickMessageForm.messageContent" placeholder="请输入图片URL" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addQuickMessageVisible = false">取消</el-button>
            <el-button type="primary" @click="saveQuickMessage">保存</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog title="修改备注" v-model="remarkModalVisible" width="400px" @close="resetRemarkForm">
        <el-form :model="remarkForm" label-width="80px">
          <el-form-item label="备注">
            <el-input v-model="remarkForm.remark" type="textarea" :rows="3" placeholder="请输入备注内容" maxlength="255" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="remarkModalVisible = false">取消</el-button>
            <el-button type="primary" @click="saveRemark">保存</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog title="批量编辑" v-model="batchEditVisible" width="400px" @close="resetBatchEditForm">
        <el-form :model="batchEditForm" label-width="100px">
          <el-form-item label="时间">
            <el-input v-model="batchEditForm.createdAt" placeholder="请输入时间"></el-input>
          </el-form-item>
          <el-form-item label="客户来源">
            <el-input v-model="batchEditForm.soures" placeholder="请输入客户来源"></el-input>
          </el-form-item>
          <el-form-item label="添加时间">
            <el-date-picker v-model="batchEditForm.addTime" type="datetime" placeholder="请选择添加时间" format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width: 100%"></el-date-picker>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="batchEditVisible = false">取消</el-button>
            <el-button type="primary" @click="submitBatchEdit">提交</el-button>
          </span>
        </template>
      </el-dialog>

      <el-dialog title="批量插入消息" v-model="batchInsertVisible" width="550px" @close="resetBatchInsertForm">
        <el-form :model="batchInsertForm" label-width="100px">
          <el-form-item label="消息类型">
            <el-select v-model="batchInsertForm.contentType" placeholder="请选择消息类型" @change="handleBatchTypeChange">
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
          </el-form-item>
          <el-form-item label="发送方">
            <div class="source-toggle">
              <span class="source-btn" :class="{ active: batchInsertForm.location === 1 }" @click="batchInsertForm.location = 1">我</span>
              <span class="source-btn" :class="{ active: batchInsertForm.location === 0 }" @click="batchInsertForm.location = 0">对方</span>
            </div>
          </el-form-item>
          <el-form-item :label="batchTypeLabels[batchInsertForm.contentType]">
            <div v-if="batchInsertForm.contentType === 'chat'">
              <el-input v-model="batchInsertForm.content" type="textarea" :rows="3" placeholder="请输入消息内容" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'order'">
              <el-input v-model="batchInsertForm.shopName" placeholder="店铺名称" class="form-input" />
              <el-input v-model="batchInsertForm.gusetName" placeholder="付款人" class="form-input" />
              <el-input v-model="batchInsertForm.price" placeholder="金额" class="form-input" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'transfer'">
              <el-input v-model="batchInsertForm.name" placeholder="用户名" class="form-input" />
              <el-input v-model="batchInsertForm.amount" placeholder="金额" class="form-input" />
              <el-input v-model="batchInsertForm.tip" placeholder="提示信息" class="form-input" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'wxtf'">
              <el-input v-model="batchInsertForm.name" placeholder="用户名" class="form-input" />
              <el-input v-model="batchInsertForm.amount" placeholder="金额" class="form-input" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'photo'">
              <div class="image-preview-container" @click="handleImageDoubleClick">
                <div v-if="batchInsertForm.avatar">
                  <img :src="batchInsertForm.avatar" alt="图片预览" class="image-preview" />
                  <div class="image-upload-tip" v-if="!uploading">单击更换图片</div>
                </div>
                <div v-else>
                  <div class="image-placeholder">
                    <span v-if="!uploading">单击上传图片</span>
                    <span v-else>上传中...</span>
                  </div>
                </div>
                <div v-if="uploading" class="image-loading-overlay">
                  <span>上传中...</span>
                </div>
              </div>
              <input type="file" ref="imageUploadRef" accept="image/*" style="display: none" @change="handleImageUpload" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'redBag'">
              <span class="no-need-tip">无需填写内容</span>
            </div>
            <div v-else-if="batchInsertForm.contentType === 'file'">
              <el-input v-model="batchInsertForm.fileName" placeholder="文件名" class="form-input" />
              <el-input v-model="batchInsertForm.fileSize" placeholder="文件大小" class="form-input" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'yuyin'">
              <el-input-number v-model="batchInsertForm.time" :min="1" :max="3600" placeholder="时长（秒）" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'crad'">
              <el-input v-model="batchInsertForm.nickname" placeholder="昵称" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'video'">
              <el-input v-model="batchInsertForm.content" placeholder="通话时长" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'phone'">
              <el-input v-model="batchInsertForm.content" placeholder="状态" />
            </div>
            <div v-else-if="batchInsertForm.contentType === 'tips'">
              <el-input v-model="batchInsertForm.content" placeholder="提示内容" />
            </div>
          </el-form-item>
          <el-form-item>
            <div class="quote-toggle" @click="showBatchQuote = !showBatchQuote">
              <span class="quote-icon">{{ showBatchQuote ? '▼' : '▶' }}</span>
              <span>添加引用消息</span>
            </div>
            <div v-if="showBatchQuote" class="quote-form">
              <el-input v-model="batchQuoteData.fromName" placeholder="引用来源名称" class="form-input" />
              <el-select v-model="batchQuoteData.fromLocation" placeholder="引用来源" class="form-input">
                <el-option label="对方" :value="0" />
                <el-option label="我方" :value="1" />
              </el-select>
              <el-select v-model="batchQuoteData.contentType" placeholder="引用类型" class="form-input">
                <el-option label="文本消息" value="chat" />
                <el-option label="图片消息" value="photo" />
                <el-option label="文件" value="file" />
              </el-select>
              <el-input v-model="batchQuoteData.previewText" type="textarea" :rows="2" placeholder="引用内容预览" />
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="batchInsertVisible = false">取消</el-button>
            <el-button type="primary" @click="submitBatchInsert">批量插入</el-button>
          </span>
        </template>
      </el-dialog>

      <input type="file" ref="editImageUploadRef" accept="image/*" style="display: none" @change="handleMessageImageUpload" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/userStore'
import { conversationsApi } from '../api/conversations'
import { fileApi } from '../api/file'
import { quickMessagesApi, type QuickMessage } from '../api/quickMessages'
import type { Conversations } from '../types/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { parseMessageContent, type FormattedMessage } from '../utils/messageFormatter'
import { formatMessageContent, type MessageItem } from '../utils/messageFormatter'
import MessageEditor from '../components/MessageEditor.vue'

const router = useRouter()
const userStore = useUserStore()

const conversations = ref<Conversations[]>([])
const loading = ref(false)
const selectedConversation = ref<Conversations | null>(null)
const selectedId = ref<string>('')
const selectedIds = ref<string[]>([])

const batchEditVisible = ref(false)
const batchEditForm = reactive({ createdAt: '', soures: '', addTime: '' })

const remarkModalVisible = ref(false)
const remarkForm = reactive({ conversationId: '', remark: '' })

const batchInsertVisible = ref(false)
const showBatchQuote = ref(false)
const imageUploadRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const editImageUploadRef = ref<HTMLInputElement | null>(null)
const editingImageIndex = ref<number>(-1)

const quickMessages = ref<QuickMessage[]>([])
const quickMessagesLoading = ref(false)
const addQuickMessageVisible = ref(false)
const quickMessageForm = reactive({ messageType: 'text', messageContent: '' })

const batchTypeLabels: Record<string, string> = {
  chat: '消息内容', order: '收款信息', transfer: '转账信息', wxtf: '收款信息',
  photo: '图片链接', redBag: '红包', file: '文件信息', yuyin: '语音时长',
  crad: '名片信息', video: '通话时长', phone: '通话状态', tips: '提示内容'
}

const batchInsertForm = reactive({
  contentType: 'chat', location: 1, content: '', shopName: '', gusetName: '', price: '',
  name: '', amount: '', tip: '', avatar: '', fileName: '', fileSize: '', time: 0, nickname: ''
})

const batchQuoteData = reactive({ fromName: '', fromLocation: 0, contentType: 'chat', previewText: '' })

const editableMessages = ref<FormattedMessage[]>([])
const editingIndex = ref<number>(-1)
const editingContent = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)
const messageListRef = ref<HTMLElement | null>(null)

const isAllSelected = computed(() => conversations.value.length > 0 && selectedIds.value.length === conversations.value.length)
const isIndeterminate = computed(() => selectedIds.value.length > 0 && selectedIds.value.length < conversations.value.length)

const formatMemberExpireAt = computed(() => {
  const expireAt = userStore.getUser?.memberExpireAt
  if (!expireAt) return '-'
  try {
    const date = new Date(expireAt)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  } catch {
    return '-'
  }
})

const getAvatarColor = (name: string | undefined) => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ]
  if (!name) return colors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const formattedMessages = computed<FormattedMessage[]>(() => editableMessages.value)

const initMessages = () => {
  if (!selectedConversation.value?.content) {
    editableMessages.value = []
    return
  }
  editableMessages.value = parseMessageContent(selectedConversation.value.content)
}

const fetchConversations = async () => {
  loading.value = true
  try {
    const userId = userStore.getUser?.id || '1'
    const response = await conversationsApi.getByUserId(userId, 'chat')
    conversations.value = response.data.data.map(item => ({ ...item, _selected: false }))
  } catch {
    conversations.value = [
      { conversationId: '1', name: '测试1', avatarUrl: '', createdAt: '上午 9:00', id: '1', _selected: false },
      { conversationId: '2', name: '测试2', avatarUrl: '', createdAt: '上午 8:30', id: '2', _selected: false },
      { conversationId: '3', name: '测试3', avatarUrl: '', createdAt: '上午 8:00', id: '3', _selected: false }
    ] as unknown as Conversations[]
  } finally {
    loading.value = false
  }
}

const fetchQuickMessages = async () => {
  const userId = userStore.getUser?.id
  if (!userId) return
  quickMessagesLoading.value = true
  try {
    const response = await quickMessagesApi.getByUserId(Number(userId))
    if (response?.data?.data) quickMessages.value = response.data.data
  } catch {
    console.error('获取快捷消息失败')
  } finally {
    quickMessagesLoading.value = false
  }
}

const selectConversation = (item: Conversations) => {
  selectedConversation.value = item
  selectedId.value = item.conversationId
  initMessages()
}

const handleSelectAll = (val: unknown) => {
  const isChecked = typeof val === 'boolean' ? val : (val as { checked: boolean }).checked
  conversations.value.forEach(item => item._selected = isChecked)
  selectedIds.value = isChecked ? conversations.value.map(item => item.conversationId) : []
}

const handleSelectItem = (id: string, val: unknown) => {
  const isChecked = typeof val === 'boolean' ? val : (val as { checked: boolean }).checked
  const item = conversations.value.find(i => i.conversationId === id)
  if (item) item._selected = isChecked
  selectedIds.value = isChecked
    ? [...new Set([...selectedIds.value, id])]
    : selectedIds.value.filter(itemId => itemId !== id)
}

const handleDoubleClick = (index: number) => {
  editingIndex.value = index
  editingContent.value = editableMessages.value[index].content
  setTimeout(() => {
    editInputRef.value?.focus()
    editInputRef.value?.select()
  }, 0)
}

const saveEdit = () => {
  if (editingIndex.value >= 0 && editingIndex.value < editableMessages.value.length) {
    editableMessages.value[editingIndex.value].content = editingContent.value
  }
  editingIndex.value = -1
  editingContent.value = ''
}

const cancelEdit = () => {
  editingIndex.value = -1
  editingContent.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if (editingIndex.value >= 0) {
    if (e.key === 'Enter') saveEdit()
    else if (e.key === 'Escape') cancelEdit()
  }
}

const handleBlur = () => {
  if (editingIndex.value >= 0) saveEdit()
}

const handleInsertMessage = (message: MessageItem) => {
  editableMessages.value.push(formatMessageContent(message))
  ElMessage.success('消息已添加')
  setTimeout(() => {
    if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }, 100)
}

const handleImageDoubleClick = () => {
  if (!uploading.value) imageUploadRef.value?.click()
}

const handleMessageImageDoubleClick = (index: number) => {
  editingImageIndex.value = index
  editImageUploadRef.value?.click()
}

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  uploading.value = true
  try {
    const conversationId = selectedId.value || 'default'
    const response = await fileApi.uploadImage(conversationId, file)
    if (response?.data?.data) {
      batchInsertForm.avatar = response.data.data
      ElMessage.success('图片上传成功')
    }
  } catch {
    ElMessage.error('图片上传失败')
  } finally {
    uploading.value = false
    target.value = ''
  }
}

const handleMessageImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  const index = editingImageIndex.value
  if (!file || index < 0) {
    editingImageIndex.value = -1
    return
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    editingImageIndex.value = -1
    return
  }
  try {
    const conversationId = selectedId.value || 'default'
    const response = await fileApi.uploadImage(conversationId, file)
    if (response?.data?.data) {
      editableMessages.value[index].imageUrl = response.data.data
      editableMessages.value[index].content = response.data.data
      ElMessage.success('图片替换成功')
    }
  } catch {
    ElMessage.error('图片替换失败')
  } finally {
    editingImageIndex.value = -1
    target.value = ''
  }
}

const buildBatchContent = (): unknown => {
  switch (batchInsertForm.contentType) {
    case 'chat': case 'tips': case 'video': case 'phone':
      return batchInsertForm.content
    case 'order':
      return { shopName: batchInsertForm.shopName, gusetName: batchInsertForm.gusetName, price: batchInsertForm.price }
    case 'transfer':
      return { name: batchInsertForm.name, amount: batchInsertForm.amount, tip: batchInsertForm.tip }
    case 'wxtf':
      return { name: batchInsertForm.name, amount: batchInsertForm.amount }
    case 'photo':
      return { avatar: batchInsertForm.avatar }
    case 'redBag':
      return true
    case 'file':
      return { fileName: batchInsertForm.fileName, fileSize: batchInsertForm.fileSize, isCop: false }
    case 'yuyin':
      return { time: batchInsertForm.time }
    case 'crad':
      return { nickname: batchInsertForm.nickname, avatar: '' }
    default:
      return batchInsertForm.content
  }
}

const submitBatchInsert = () => {
  const contentType = batchInsertForm.contentType
  const requiredFields: string[] = []
  
  if ((contentType === 'chat' || contentType === 'tips' || contentType === 'video' || contentType === 'phone') && !batchInsertForm.content) {
    requiredFields.push(batchTypeLabels[contentType])
  } else if (contentType === 'order') {
    if (!batchInsertForm.shopName) requiredFields.push('店铺名称')
    if (!batchInsertForm.gusetName) requiredFields.push('付款人')
    if (!batchInsertForm.price) requiredFields.push('金额')
  } else if (contentType === 'transfer') {
    if (!batchInsertForm.name) requiredFields.push('用户名')
    if (!batchInsertForm.amount) requiredFields.push('金额')
  } else if (contentType === 'wxtf') {
    if (!batchInsertForm.name) requiredFields.push('用户名')
    if (!batchInsertForm.amount) requiredFields.push('金额')
  } else if (contentType === 'photo' && !batchInsertForm.avatar) {
    requiredFields.push('图片链接')
  } else if (contentType === 'file') {
    if (!batchInsertForm.fileName) requiredFields.push('文件名')
    if (!batchInsertForm.fileSize) requiredFields.push('文件大小')
  } else if (contentType === 'yuyin' && !batchInsertForm.time) {
    requiredFields.push('时长')
  } else if (contentType === 'crad' && !batchInsertForm.nickname) {
    requiredFields.push('昵称')
  }
  
  if (requiredFields.length > 0) {
    ElMessage.warning(`请填写：${requiredFields.join('、')}`)
    return
  }
  
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择会话')
    return
  }
  
  const quote = showBatchQuote.value && batchQuoteData.previewText ? {
    fromName: batchQuoteData.fromName,
    fromLocation: batchQuoteData.fromLocation,
    contentType: batchQuoteData.contentType,
    previewText: batchQuoteData.previewText
  } : undefined
  
  selectedIds.value.forEach(conversationId => {
    const conversation = conversations.value.find(c => c.conversationId === conversationId)
    if (conversation) {
      let existingMessages: MessageItem[] = []
      if (conversation.content) {
        try {
          existingMessages = JSON.parse(conversation.content)
        } catch {
          existingMessages = []
        }
      }
      const message: MessageItem = {
        type: batchInsertForm.contentType === 'tips' ? 'tips' : 'content',
        contentType: batchInsertForm.contentType,
        location: batchInsertForm.location,
        content: buildBatchContent()
      }
      if (quote) (message as any).quote = quote
      existingMessages.push(message)
      conversation.content = JSON.stringify(existingMessages)
    }
  })
  
  if (selectedConversation.value && selectedIds.value.includes(selectedConversation.value.conversationId)) {
    initMessages()
  }
  
  ElMessage.success(`成功向 ${selectedIds.value.length} 个会话插入消息`)
  batchInsertVisible.value = false
  resetBatchInsertForm()
  
  setTimeout(() => {
    if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }, 100)
}

const saveSelectedConversations = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要保存的会话')
    return
  }
  try {
    const conversationsToSave = conversations.value.filter(conv => selectedIds.value.includes(conv.conversationId))
    await conversationsApi.batchSave(conversationsToSave)
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  }
}

const saveQuickMessage = async () => {
  if (!quickMessageForm.messageContent.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }
  const userId = userStore.getUser?.id
  if (!userId) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    await quickMessagesApi.create({
      userId: Number(userId),
      messageType: quickMessageForm.messageType,
      messageContent: quickMessageForm.messageContent
    })
    ElMessage.success('快捷消息添加成功')
    addQuickMessageVisible.value = false
    resetQuickMessageForm()
    fetchQuickMessages()
  } catch {
    ElMessage.error('添加失败')
  }
}

const insertQuickMessage = (msg: QuickMessage) => {
  if (!selectedConversation.value) {
    ElMessage.warning('请先选择一个会话')
    return
  }
  const message: MessageItem = {
    type: 'content',
    contentType: msg.messageType === 'image' ? 'photo' : 'chat',
    location: 1,
    content: msg.messageType === 'image' ? { avatar: msg.messageContent } : msg.messageContent
  }
  handleInsertMessage(message)
}

const deleteQuickMessage = async (id: number | undefined) => {
  if (!id) return
  try {
    await ElMessageBox.confirm('确定要删除这条快捷消息吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await quickMessagesApi.delete(id)
    ElMessage.success('删除成功')
    fetchQuickMessages()
  } catch (e: unknown) {
    if (e !== 'cancel') {
      ElMessage.error(e instanceof Error ? e.message : '删除失败')
    }
  }
}

const openAddQuickMessageModal = () => { addQuickMessageVisible.value = true }
const resetQuickMessageForm = () => { quickMessageForm.messageType = 'text'; quickMessageForm.messageContent = '' }

const openBatchEditModal = () => { if (selectedIds.value.length > 0) batchEditVisible.value = true }
const resetBatchEditForm = () => { batchEditForm.createdAt = ''; batchEditForm.soures = ''; batchEditForm.addTime = '' }

const openRemarkModal = (item: Conversations) => {
  remarkForm.conversationId = item.conversationId
  remarkForm.remark = item.remark || ''
  remarkModalVisible.value = true
}
const resetRemarkForm = () => {
  remarkForm.conversationId = ''
  remarkForm.remark = ''
}
const saveRemark = async () => {
  try {
    await conversationsApi.updateRemark(remarkForm.conversationId, remarkForm.remark)
    ElMessage.success('备注修改成功')
    const target = conversations.value.find(c => c.conversationId === remarkForm.conversationId)
    if (target) target.remark = remarkForm.remark
    if (selectedConversation.value?.conversationId === remarkForm.conversationId) {
      selectedConversation.value.remark = remarkForm.remark
    }
    remarkModalVisible.value = false
  } catch {
    ElMessage.error('备注修改失败')
  }
}

const submitBatchEdit = async () => {
  try {
    await conversationsApi.batchUpdate({
      conversationIds: selectedIds.value,
      createdAt: batchEditForm.createdAt || undefined,
      soures: batchEditForm.soures || undefined,
      addTime: batchEditForm.addTime || undefined
    })
    ElMessage.success('批量修改成功')
    batchEditVisible.value = false
    resetBatchEditForm()
    selectedIds.value = []
    await fetchConversations()
  } catch {
    ElMessage.error('批量修改失败')
  }
}

const openBatchInsertModal = () => { batchInsertVisible.value = true }
const resetBatchInsertForm = () => {
  batchInsertForm.contentType = 'chat'
  batchInsertForm.location = 1
  batchInsertForm.content = ''
  batchInsertForm.shopName = ''
  batchInsertForm.gusetName = ''
  batchInsertForm.price = ''
  batchInsertForm.name = ''
  batchInsertForm.amount = ''
  batchInsertForm.tip = ''
  batchInsertForm.avatar = ''
  batchInsertForm.fileName = ''
  batchInsertForm.fileSize = ''
  batchInsertForm.time = 0
  batchInsertForm.nickname = ''
  showBatchQuote.value = false
  batchQuoteData.fromName = ''
  batchQuoteData.fromLocation = 0
  batchQuoteData.contentType = 'chat'
  batchQuoteData.previewText = ''
}

const handleBatchTypeChange = () => {
  batchInsertForm.content = ''
  batchInsertForm.shopName = ''
  batchInsertForm.gusetName = ''
  batchInsertForm.price = ''
  batchInsertForm.name = ''
  batchInsertForm.amount = ''
  batchInsertForm.tip = ''
  batchInsertForm.avatar = ''
  batchInsertForm.fileName = ''
  batchInsertForm.fileSize = ''
  batchInsertForm.time = 0
  batchInsertForm.nickname = ''
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchConversations()
  fetchQuickMessages()
})
</script>

<style scoped>
/* 统一transition变量 */
:root {
  --transition-all: all 0.3s ease;
  --transition-fast: all 0.2s ease;
}

.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  transition: var(--transition-all);
  overflow: hidden;
}

.home-header {
  padding: 16px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  transition: var(--transition-all);
}

.home-header h1 { margin: 0; font-size: 22px; font-weight: 600; }

.user-info { display: flex; align-items: center; gap: 20px; }
.user-detail { text-align: right; transition: var(--transition-all); }
.user-phone { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
.member-status { font-size: 12px; color: rgba(255, 255, 255, 0.8); transition: var(--transition-fast); }
.member-status.member-active { color: #95de64; }

.logout-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
  color: white;
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: var(--transition-all);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.logout-btn:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.25) 100%);
  border-color: rgba(255,255,255,0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.logout-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

.home-main { flex: 1; padding: 24px; display: flex; gap: 16px; min-height: 0; transition: var(--transition-all);overflow: hidden;box-sizing: border-box; }
.control-split { flex: 1; display: flex; gap: 16px; min-height: 0; transition: var(--transition-all); }

.control-split-left, .control-split-right, .right-panel {
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: var(--transition-all);
}



.control-split-left {flex: 2; flex-shrink: 0; box-sizing: border-box; }
.control-split-right { flex: 4; flex-shrink: 0;box-sizing: border-box;  }
.right-panel { flex: 1; flex-shrink: 0; box-sizing: border-box; }

.panel-header { padding: 16px 20px; background: linear-gradient(135deg, #f8f9fc 0%, #f0f2f5 100%); border-bottom: 1px solid #ebeef5; transition: var(--transition-all); }
.panel-title { margin: 0; font-size: 16px; font-weight: 600; color: #303133; }

.list-header { padding: 12px 16px; border-bottom: 1px solid #ebeef5; background-color: #fafafa; transition: var(--transition-all); }

.conversation-list { flex: 1; overflow-y: auto; min-height: 0; transition: var(--transition-all);padding: 0 20px; }

.conversation-list .el-list-item {
  cursor: pointer;
  transition: var(--transition-fast);
  padding: 12px 16px !important;
  margin: 0 !important;
  border-bottom: 1px solid #ebeef5;
}

.conversation-list .el-list-item:last-child { border-bottom: none; }
.conversation-list .el-list-item:hover { background-color: #f5f7fa; }
.conversation-list .el-list-item.active { background-color: #e8f4fc; }

.conversation-item { display: flex; align-items: center; gap: 10px; width: 100%; }
.avatar-wrapper { position: relative; flex-shrink: 0; }
.conversation-avatar { width: 40px; height: 40px; }
.avatar-text { font-size: 16px; font-weight: 600; }

.unread-badge {
  position: absolute;
  top: -2px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  background-color: #f56c6c;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.conversation-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.conversation-header { display: flex; align-items: center; gap: 8px; }
.conversation-name { font-size: 14px; font-weight: 500; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.remark-ellipsis { font-size: 12px; color: #020202; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; font-weight: 500; }
.conversation-time { font-size: 12px; color: #909399; flex-shrink: 0; white-space: nowrap; }

.no-conversation { flex: 1; display: flex; align-items: center; justify-content: center; color: #909399; font-size: 14px; }

.message-content-section { flex: 1; margin: 8px 0; overflow-y: auto; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; }
.message-list { padding:0 12px; display: flex; flex-direction: column; gap: 16px; height: 600px;}

.message-item {
  display: flex;
  align-items: flex-start;
  max-width: 100%;
  transition: var(--transition-fast);
}

.message-item:hover { background-color: rgba(102, 126, 234, 0.03); }
.message-item.message-self { justify-content: flex-end; }
.message-item.message-other { justify-content: flex-start; }

.message-avatar { flex-shrink: 0; margin: 0 8px; }

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: var(--transition-all);
}

.avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.message-content-wrapper { display: flex; flex-direction: column; max-width: 70%; }
.message-sender { font-size: 12px; color: #909399; margin-bottom: 4px; padding-left: 4px; transition: var(--transition-fast); }
.message-self .message-sender { text-align: right; }

.message-bubble {
  padding: 12px 16px;
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
  position: relative;
  transition: var(--transition-all);
}

.message-bubble:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.message-self .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px 20px 6px 20px;
}

.message-other .message-bubble {
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 20px 20px 20px 6px;
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
  cursor: pointer;
  transition: var(--transition-fast);
}

.message-self .message-text { color: #fff; }
.message-self .message-text:hover { color: rgba(255,255,255,0.85); }
.message-other .message-text { color: #303133; }
.message-other .message-text:hover { color: #667eea; }

.source-toggle { display: flex; gap: 12px; }

.source-btn {
  flex: 1;
  padding: 10px 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: var(--transition-all);
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.source-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.source-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.12);
}

.source-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
}

.source-btn.active:hover { box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
.source-btn.active:active { transform: translateY(0); }

.message-edit { margin: 0; }

.edit-input {
  width: 100%;
  padding: 4px 8px;
  font-size: 14px;
  border: 2px solid #667eea;
  border-radius: 12px;
  background-color: #fff;
  outline: none;
  box-shadow: 0 0 12px rgba(102, 126, 234, 0.3);
  transition: var(--transition-fast);
}

.edit-input:focus {
  box-shadow: 0 0 16px rgba(102, 126, 234, 0.4);
  border-color: #764ba2;
}

.message-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 6px;
  margin-bottom: 4px;
  background-color: rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.9);
}

.message-other .message-tag { background-color: #f5f7fa; color: #909399; }

.message-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  margin: 8px 0;
  background-color: rgba(102, 126, 234, 0.1);
  border-radius: 20px;
  transition: var(--transition-all);
}

.tip-tag {
  font-size: 12px;
  font-weight: 500;
  color: #667eea;
  padding: 2px 8px;
  background-color: rgba(102, 126, 234, 0.15);
  border-radius: 4px;
  transition: var(--transition-fast);
}

.tip-content { font-size: 13px; color: #606266; transition: var(--transition-fast); }

.quote-box {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: rgba(255,255,255,0.2);
  border-left: 3px solid rgba(255,255,255,0.5);
  border-radius: 0 4px 4px 0;
  transition: var(--transition-all);
}

.message-other .quote-box { background-color: #f5f7fa; border-left-color: #909399; }
.quote-header { margin: 0 0 4px 0; font-size: 12px; font-weight: 500; }
.message-self .quote-header { color: rgba(255,255,255,0.9); }
.message-other .quote-header { color: #606266; }
.quote-type { margin: 0 0 2px 0; font-size: 11px; }
.message-self .quote-type { color: rgba(255,255,255,0.7); }
.message-other .quote-type { color: #909399; }
.quote-text { margin: 0; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.message-self .quote-text { color: rgba(255,255,255,0.8); }
.message-other .quote-text { color: #606266; }

.no-content { margin: 8px 0 0 0; font-size: 14px; color: #909399; text-align: center; }

.image-message-container {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition-all);
}

.image-message-container:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: scale(1.02);
}

.message-image { max-width: 200px; max-height: 200px; border-radius: 8px; display: block; }

.image-tip {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: rgba(255,255,255,0.8);
  font-size: 12px;
  padding: 12px 8px 8px;
  text-align: center;
  opacity: 0;
  transition: var(--transition-all);
}

.image-message-container:hover .image-tip { opacity: 1; }

.image-preview-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-all);
  background-color: #fafafa;
  overflow: hidden;
}

.image-preview-container:hover { border-color: #667eea; background-color: #f5f7fa; }
.image-preview { max-width: 200px; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); object-fit: contain; }

.image-upload-tip {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #909399;
  background-color: rgba(255,255,255,0.9);
  padding: 4px 12px;
  border-radius: 4px;
  white-space: nowrap;
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px;
  color: #909399;
  font-size: 14px;
}

.image-placeholder span { padding: 12px 20px; background-color: #f5f7fa; border-radius: 6px; }

.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #667eea;
  font-weight: 500;
}

.control-toolbar { display: flex; flex-direction: column; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #ebeef5; transition: var(--transition-all); }

.control-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition-all);
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.control-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
}

.control-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.25);
}

.control-btn:disabled {
  background: linear-gradient(135deg, #c0c4cc 0%, #a8abb2 100%);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.quick-messages-panel { flex: 1; padding: 12px 16px; overflow-y: auto; min-height: 0; }
.quick-messages-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.quick-messages-title { font-size: 14px; font-weight: 600; color: #303133; }

.add-quick-msg-btn {
  padding: 4px 12px;
  font-size: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition-all);
}

.add-quick-msg-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.35);
}

.add-quick-msg-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(102, 126, 234, 0.25);
}

.quick-messages-list { max-height: calc(100vh - 380px); overflow-y: auto; transition: var(--transition-all); }

.quick-message-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.quick-message-item:hover { background-color: #e8f4fc; border-color: #667eea; }
.quick-message-item:active { transform: scale(0.98); }
.quick-message-item:last-child { margin-bottom: 0; }

.quick-msg-type {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  margin-right: 8px;
  font-weight: 500;
  flex-shrink: 0;
  transition: var(--transition-fast);
}

.quick-msg-type.text { background-color: #e6f7ff; color: #1890ff; }
.quick-msg-type.image { background-color: #fff7e6; color: #fa8c16; }

.quick-msg-content {
  flex: 1;
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: var(--transition-fast);
}

.quick-msg-delete {
  margin-left: 8px;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #909399;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--transition-fast);
  opacity: 0;
}

.quick-message-item:hover .quick-msg-delete { opacity: 1; }

.quick-msg-delete:hover {
  background-color: #fef0f0;
  color: #f56c6c;
  transform: scale(1.1);
}

.no-quick-messages { text-align: center; color: #909399; font-size: 13px; padding: 20px 0; margin: 0; }

@media screen and (max-width: 1200px) {
  .control-split-left { width: 35%; }
  .control-split-right { width: 45%; }
  .right-panel { width: 20%; }
}

@media screen and (max-width: 992px) {
  .control-split { flex-direction: column; }
  .control-split-left, .control-split-right, .right-panel {
    width: 100%;
  }
}
</style>