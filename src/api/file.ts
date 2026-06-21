import request from './request'

export const fileApi = {
  uploadImage(conversationId: string, file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<any>(`/file/upload/${conversationId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
