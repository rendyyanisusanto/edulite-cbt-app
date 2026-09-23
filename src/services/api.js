import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ─── Request Interceptor: Attach Bearer token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cbt_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor: Handle 401 globally ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url || ''

    // Clear auth and redirect to login on 401, but avoid redirect loop
    if (status === 401 && !requestUrl.includes('/auth/login')) {
      localStorage.removeItem('cbt_access_token')
      localStorage.removeItem('cbt_user')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
