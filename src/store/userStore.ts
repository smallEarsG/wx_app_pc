import { defineStore } from 'pinia'

// 用户信息接口
interface User {
  id: string
  phone: string
  isMember: boolean
  memberExpireAt: string | null
  token: string
}

// localStorage 存储的 key
const USER_STORAGE_KEY = 'user_info'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    isLoggedIn: false
  }),

  getters: {
    // 获取用户信息
    getUser: (state) => state.user,
    // 判断是否登录
    getIsLoggedIn: (state) => state.isLoggedIn,
    // 获取用户 token
    getToken: (state) => state.user?.token || null,
    // 判断是否是会员
    getIsMember: (state) => state.user?.isMember || false
  },

  actions: {
    // 设置用户信息
    setUser(user: User) {
      this.user = user
      this.isLoggedIn = true
      // 持久化到 localStorage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    },

    // 退出登录，清除用户信息
    logout() {
      this.user = null
      this.isLoggedIn = false
      // 清除 localStorage
      localStorage.removeItem(USER_STORAGE_KEY)
    },

    // 从 localStorage 初始化用户信息
    initUser() {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY)
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User
          this.user = user
          this.isLoggedIn = true
        } catch (error) {
          console.error('解析用户信息失败:', error)
          this.user = null
          this.isLoggedIn = false
          localStorage.removeItem(USER_STORAGE_KEY)
        }
      }
    }
  }
})
