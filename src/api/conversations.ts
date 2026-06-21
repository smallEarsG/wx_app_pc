import request from './request'
import type { Conversations } from '@/types/api'

export interface BatchUpdateRequest {
  conversationIds: string[]
  createdAt?: string
  soures?: string
  addTime?: string
}

export const conversationsApi = {
  getByUserId(userId: string, type: string) {
    return request.get<{ data: Conversations[] }>(`/conversations/user/${userId}`, {
      params: { type }
    })
  },

  batchUpdate(data: BatchUpdateRequest) {
    return request.post('/conversations/batch/update', data)
  },

  save(conversation: Conversations) {
    return request.put('/conversations/save', conversation)
  },

  batchSave(conversations: Conversations[]) {
    return request.put('/conversations/batch/save', conversations)
  }
}
