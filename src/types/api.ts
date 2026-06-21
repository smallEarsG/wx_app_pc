/**
 * API 响应通用接口
 */
export interface ResponseMessage<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 用户信息接口
 */
export interface User {
  id: string
  phone: string
  isMember: boolean
  memberExpireAt: string | null
  token: string
}

/**
 * 登录参数接口
 */
export interface LoginParams {
  phone: string
  passwordHash: string
}

/**
 * 会话信息接口
 */
export interface Conversations {
  id: string
  userId: string
  type: string
  content: string
  createTime: string
  addTime: string
  avatarUrl: string
  chatIndex: string
  conversationId: string
  createdAt: string
  createdTime: string
  description: string
  name: string
  sex: string
  soures: string
  unreadCount?: number
  _selected?: boolean
  bgImage?: string
  remark?: string
}
