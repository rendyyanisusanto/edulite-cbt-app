import { defineStore } from 'pinia'
import api from '@/services/api'

const TOKEN_KEY = 'cbt_access_token'
const USER_KEY = 'cbt_user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
  }),

  getters: {
    // Helper: check if user has a specific role
    hasRole: (state) => (role) => {
      return state.user?.roles?.includes(role) ?? false
    },
    isAdmin: (state) => state.user?.roles?.includes('ADMIN') ?? false,
    isGuru: (state) => state.user?.roles?.includes('GURU') ?? false,
  },

  actions: {
    /**
     * Login via backend API.
     * @param {string} login - username or email
     * @param {string} password
     */
    async login(login, password) {
      this.loading = true
      try {
        const { data } = await api.post('/auth/login', { login, password })
        const { accessToken, user } = data.data

        // Persist to localStorage
        localStorage.setItem(TOKEN_KEY, accessToken)
        localStorage.setItem(USER_KEY, JSON.stringify(user))

        // Update state
        this.accessToken = accessToken
        this.user = user
        this.isAuthenticated = true

        return user
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch current user from backend.
     * Validates token is still valid and returns fresh data.
     */
    async fetchMe() {
      const { data } = await api.get('/auth/me')
      this.user = data.data.user
      this.isAuthenticated = true
      // Sync localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      return this.user
    },

    /**
     * Logout — clear token and user state.
     */
    async logout() {
      this.loading = true
      try {
        // Notify backend (fire and forget — don't block on failure)
        await api.post('/auth/logout').catch(() => {})
      } finally {
        this._clearAuth()
        this.loading = false
      }
    },

    /**
     * Restore session on app startup.
     * If token exists, verify it with the backend.
     * If invalid, clear and redirect to login.
     */
    async restoreSession() {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) return

      // Optimistically set token so interceptor can attach it
      this.accessToken = token

      try {
        await this.fetchMe()
      } catch {
        // Token invalid or expired — clear everything
        this._clearAuth()
      }
    },

    _clearAuth() {
      this.user = null
      this.accessToken = null
      this.isAuthenticated = false
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})
