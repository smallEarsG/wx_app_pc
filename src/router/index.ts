import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router'
import { useUserStore } from '../store/userStore'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false,
      title: '登录'
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: '首页'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 检查认证
router.beforeEach((to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  // 获取 userStore 实例并初始化用户信息
  const userStore = useUserStore()
  userStore.initUser()

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    // 需要认证的页面，检查是否已登录
    if (!userStore.getIsLoggedIn) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存目标路由，登录后可跳转
      })
    } else {
      // 已登录，放行
      next()
    }
  } else {
    // 不需要认证的页面
    if (to.path === '/login' && userStore.getIsLoggedIn) {
      // 已登录访问登录页，跳转到首页
      next({ path: '/' })
    } else {
      next()
    }
  }
})

export default router
