/**
 * 消息类型定义
 */
export interface MessageItem {
  type: 'tips' | 'content'
  contentType: string
  location?: number
  content: unknown
  quote?: QuoteInfo
}

export interface QuoteInfo {
  fromName: string
  fromLocation: number
  contentType: string
  previewText: string
}

export interface FormattedMessage {
  type: 'tips' | 'content'
  label: string
  content: string
  from?: string
  quote?: {
    from: string
    type: string
    text: string
  }
  imageUrl?: string
}

/**
 * contentType 到中文名称的映射
 */
const contentTypeLabels: Record<string, string> = {
  chat: '文本消息',
  order: '对外收款',
  transfer: '转账',
  wxtf: '收款',
  photo: '图片消息',
  redBag: '红包',
  file: '文件',
  yuyin: '语音消息',
  crad: '名片',
  video: '视频通话',
  phone: '语音通话',
  tips: '提示'
}

/**
 * tipType 到中文提示的映射
 */
const tipTypeLabels: Record<string, string> = {
  payment: '收款提示',
  revoke_other: '对方撤回了一条消息',
  revoke_self: '你撤回了一条消息',
  add_contact: '添加好友'
}

/**
 * 获取 contentType 的中文标签
 */
export function getContentTypeLabel(contentType: string): string {
  if (!contentType) return '未知消息'
  return contentTypeLabels[contentType] || contentType
}

/**
 * 格式化引用消息
 */
export function formatQuote(quote: QuoteInfo): { from: string; type: string; text: string } {
  return {
    from: quote.fromLocation === 0 ? '对方' : '我方',
    type: getContentTypeLabel(quote.contentType),
    text: quote.previewText
  }
}

/**
 * 格式化单个消息内容
 */
export function formatMessageContent(message: MessageItem): FormattedMessage {
  const { type, contentType, content, quote, location } = message
  const label = getContentTypeLabel(contentType)
  let formattedContent = ''

  // 根据 location 判断消息来源
  const from = location === 0 ? '对方' : (location === 1 ? '我' : undefined)

  // 处理 tips 类型消息（系统提示，不需要来源）
  if (type === 'tips') {
    return {
      type: 'tips',
      label: '提示',
      content: typeof content === 'string' ? content : JSON.stringify(content)
    }
  }

  // 处理系统提示消息 (contentType 为 tips)
  if (contentType === 'tips' && typeof content === 'object' && content !== null) {
    const tipContent = content as { tipType?: string; gusetName?: string }
    const tipType = tipContent.tipType
    if (tipType === 'payment') {
      formattedContent = `你收到了${tipContent.gusetName || '未知'}的付款`
    } else if (tipType && tipTypeLabels[tipType]) {
      formattedContent = tipTypeLabels[tipType]
    } else {
      formattedContent = JSON.stringify(content)
    }
    return { type: 'content', label, content: formattedContent }
  }

  // 根据不同类型格式化内容
  switch (contentType) {
    case 'chat':
      formattedContent = typeof content === 'string' ? content : JSON.stringify(content)
      break

    case 'order':
      if (typeof content === 'object' && content !== null) {
        const orderContent = content as { shopName?: string; gusetName?: string; price?: string }
        formattedContent = `${orderContent.shopName || '未知店铺'} - ${orderContent.gusetName || '未知付款人'} - ¥${orderContent.price || '0'}`
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'transfer':
      if (typeof content === 'object' && content !== null) {
        const transferContent = content as { name?: string; amount?: string; tip?: string }
        formattedContent = `${transferContent.name || '未知用户'} - ¥${transferContent.amount || '0'}${transferContent.tip ? ` - ${transferContent.tip}` : ''}`
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'wxtf':
      if (typeof content === 'object' && content !== null) {
        const wxtfContent = content as { name?: string; amount?: string }
        formattedContent = `${wxtfContent.name || '未知用户'} - ¥${wxtfContent.amount || '0'}`
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'photo':
      if (typeof content === 'object' && content !== null) {
        const photoContent = content as { avatar?: string }
        formattedContent = photoContent.avatar || '图片链接'
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'redBag':
      formattedContent = '红包消息'
      break

    case 'file':
      if (typeof content === 'object' && content !== null) {
        const fileContent = content as { fileName?: string; fileSize?: string }
        formattedContent = `${fileContent.fileName || '未知文件'} (${fileContent.fileSize || '未知大小'})`
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'yuyin':
      if (typeof content === 'object' && content !== null) {
        const yuyinContent = content as { time?: number }
        formattedContent = `${yuyinContent.time || 0}秒`
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'crad':
      if (typeof content === 'object' && content !== null) {
        const cradContent = content as { nickname?: string }
        formattedContent = cradContent.nickname || '未知用户'
      } else {
        formattedContent = JSON.stringify(content)
      }
      break

    case 'video':
      formattedContent = typeof content === 'string' ? content : JSON.stringify(content)
      break

    case 'phone':
      formattedContent = typeof content === 'string' ? content : JSON.stringify(content)
      break

    default:
      formattedContent = typeof content === 'string' ? content : JSON.stringify(content)
  }

  const result: FormattedMessage = { type: 'content', label, content: formattedContent }

  // 添加消息来源
  if (from !== undefined) {
    result.from = from
  }

  // 处理引用消息
  if (quote) {
    result.quote = formatQuote(quote)
  }

  // 如果是图片类型消息，提取图片URL
  if (contentType === 'photo') {
    if (typeof content === 'object' && content !== null) {
      const photoContent = content as { avatar?: string }
      result.imageUrl = photoContent.avatar
    }
  }

  return result
}

/**
 * 解析消息内容为格式化的消息数组
 * @param content 原始内容（可以是字符串、对象或数组）
 * @returns 格式化后的消息数组
 */
export function parseMessageContent(content: unknown): FormattedMessage[] {
  // 如果内容为空，返回空数组
  if (!content) {
    return []
  }

  // 如果内容是字符串，尝试解析为 JSON
  let parsedContent: unknown = content
  if (typeof content === 'string') {
    try {
      parsedContent = JSON.parse(content)
    } catch {
      // 如果解析失败，作为普通文本处理
      return [{ type: 'content', label: '文本消息', content: content }]
    }
  }

  // 如果解析后是数组，遍历处理每条消息
  if (Array.isArray(parsedContent)) {
    return parsedContent.map(item => {
      // 确保每个 item 符合 MessageItem 结构
      const message: MessageItem = {
        type: item.type || 'content',
        contentType: item.contentType || 'chat',
        location: item.location,
        content: item.content,
        quote: item.quote
      }
      return formatMessageContent(message)
    })
  }

  // 如果是单个消息对象
  if (typeof parsedContent === 'object' && parsedContent !== null) {
    const item = parsedContent as Record<string, unknown>
    const message: MessageItem = {
      type: (item.type as 'tips' | 'content') || 'content',
      contentType: (item.contentType as string) || 'chat',
      location: item.location as number | undefined,
      content: item.content,
      quote: item.quote as QuoteInfo | undefined
    }
    return [formatMessageContent(message)]
  }

  // 其他情况，返回原始内容的字符串形式
  return [{ type: 'content', label: '内容', content: String(content) }]
}
