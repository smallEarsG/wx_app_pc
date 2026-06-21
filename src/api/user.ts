import request from './request'
import { type ResponseMessage, type User, type LoginParams } from '@/types/api'
import type { AxiosResponse } from 'axios'

/**
 * 用户登录
 * @param params 登录参数
 * @returns 用户信息
 */
export function login(params: LoginParams): Promise<ResponseMessage<User>> {
  const formData = new FormData()
  formData.append('phone', params.phone)
  formData.append('passwordHash', params.passwordHash)
  
  return request.post<ResponseMessage<User>>('/user/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }).then((res: AxiosResponse<ResponseMessage<User>>) => res.data)
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function getUserInfo(): Promise<ResponseMessage<User>> {
  return request.get<ResponseMessage<User>>('/user/info')
    .then((res: AxiosResponse<ResponseMessage<User>>) => res.data)
}
