<template>
  <div class="login-container">
    <div class="login-box">
      <h1>销售模板生成器</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="phone">手机号</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            placeholder="请输入手机号"
            :disabled="loading"
          />
          <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            :disabled="loading"
          />
          <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
        </div>
        <span v-if="loginError" class="error-message login-error">{{ loginError }}</span>
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/api/user'
import { useUserStore } from '@/store/userStore'
import type { User } from '@/types/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  phone: '',
  password: ''
})

// 表单验证错误
const errors = reactive({
  phone: '',
  password: ''
})

// 登录状态
const loading = ref(false)
const loginError = ref('')

// 表单验证
const validateForm = (): boolean => {
  let isValid = true
  errors.phone = ''
  errors.password = ''
  loginError.value = ''

  // 验证手机号
  if (!formData.phone.trim()) {
    errors.phone = '请输入手机号'
    isValid = false
  } else if (!/^\d{11}$/.test(formData.phone.trim())) {
    errors.phone = '手机号必须是11位数字'
    isValid = false
  }

  // 验证密码
  if (!formData.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少需要6位'
    isValid = false
  }

  return isValid
}

// 处理登录
const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  loading.value = true
  loginError.value = ''

  try {
    const response = await login({
      phone: formData.phone.trim(),
      passwordHash: formData.password // 暂时使用明文，后续可添加加密
    })

    if (response.code === 200 && response.data) {
      // 登录成功，保存用户信息
      userStore.setUser(response.data as User)
      // 跳转到目标页面或首页
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    } else {
      // 登录失败
      loginError.value = response.message || '登录失败，请重试'
    }
  } catch (error: any) {
    // 处理错误
    if (error.response?.status === 401) {
      loginError.value = '用户名或密码错误'
    } else if (error.response?.status === 500) {
      loginError.value = '登录失败，请重试'
    } else {
      loginError.value = error.response?.data?.message || '网络错误，请检查网络连接'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 400px;
  margin: 20px;
}

.login-box h1 {
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.form-group input {
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s, box-shadow 0.3s;
  outline: none;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-group input::placeholder {
  color: #aaa;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: -4px;
}

.login-error {
  text-align: center;
  padding: 8px;
  background-color: #fdf2f2;
  border-radius: 6px;
}

.login-btn {
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
