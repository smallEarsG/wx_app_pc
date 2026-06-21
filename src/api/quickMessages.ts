import request from './request'

export interface QuickMessage {
  id?: number
  userId: number
  messageContent: string
  messageType: string
  isFavorite?: number
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export const quickMessagesApi = {
  // 创建快捷消息
  create(data: QuickMessage) {
    return request.post('/quick-messages', data)
  },

  // 根据用户ID查询快捷消息列表
  getByUserId(userId: number) {
    return request.get<{ data: QuickMessage[] }>(`/quick-messages/user/${userId}`)
  },

  // 根据ID查询单个快捷消息
  getById(id: number) {
    return request.get<{ data: QuickMessage }>(`/quick-messages/${id}`)
  },

  // 更新快捷消息
  update(id: number, data: Partial<QuickMessage>) {
    return request.put(`/quick-messages/${id}`, data)
  },

  // 删除快捷消息
  delete(id: number) {
    return request.delete(`/quick-messages/${id}`)
  }
}
