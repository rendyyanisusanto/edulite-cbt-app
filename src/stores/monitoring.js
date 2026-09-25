import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from './auth'

export const useMonitoringStore = defineStore('monitoring', {
  state: () => ({
    schedules: [],
    currentSchedule: null,
    participants: [],
    summary: {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      submitted: 0,
      timeExpired: 0,
      stale: 0,
      blocked: 0
    },
    participantDetail: null,
    loading: false,
    refreshing: false,
    error: null,
    lastUpdatedAt: null,
    pollingInterval: null,
    searchQuery: '',
    statusFilter: 'SEMUA'
  }),
  getters: {
    apiPrefix() {
      const authStore = useAuthStore()
      return authStore.isAdmin ? '/admin' : '/teacher'
    },
    filteredParticipants(state) {
      let result = [...state.participants]
      
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        result = result.filter(p => 
          p.student.name.toLowerCase().includes(q) || 
          (p.student.nis && p.student.nis.toLowerCase().includes(q))
        )
      }

      if (state.statusFilter !== 'SEMUA') {
        if (state.statusFilter === 'STALE') {
          result = result.filter(p => p.isStale && p.status === 'IN_PROGRESS')
        } else {
          result = result.filter(p => p.status === state.statusFilter)
        }
      }

      // Default sorting: IN_PROGRESS first, then NOT_STARTED, then rest
      result.sort((a, b) => {
        const priority = {
          'IN_PROGRESS': 1,
          'NOT_STARTED': 2,
          'TIME_EXPIRED': 3,
          'SUBMITTED': 4,
          'BLOCKED': 5
        }
        const pA = priority[a.status] || 9
        const pB = priority[b.status] || 9
        
        if (pA !== pB) return pA - pB
        return a.student.name.localeCompare(b.student.name)
      })

      return result
    }
  },
  actions: {
    async fetchSchedules() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`${this.apiPrefix}/monitoring`)
        this.schedules = response.data.data.items || []
        this.lastUpdatedAt = new Date()
      } catch (err) {
        this.error = err.response?.data?.message || 'Gagal memuat jadwal ujian.'
      } finally {
        this.loading = false
      }
    },
    
    async fetchMonitoringDetail(scheduleId, isSilent = false) {
      if (!isSilent) this.loading = true
      this.refreshing = isSilent
      this.error = null
      
      try {
        const response = await api.get(`${this.apiPrefix}/monitoring/${scheduleId}`)
        const data = response.data.data
        this.currentSchedule = data.schedule
        this.participants = data.participants || []
        this.summary = data.summary || this.summary
        this.lastUpdatedAt = new Date()
      } catch (err) {
        this.error = err.response?.data?.message || 'Gagal memuat detail monitoring.'
      } finally {
        this.loading = false
        this.refreshing = false
      }
    },

    async fetchParticipantDetail(scheduleId, participantId) {
      try {
        const response = await api.get(`${this.apiPrefix}/monitoring/${scheduleId}/participants/${participantId}`)
        this.participantDetail = response.data.data
        return this.participantDetail
      } catch (err) {
        throw new Error(err.response?.data?.message || 'Gagal memuat detail peserta.')
      }
    },

    clearParticipantDetail() {
      this.participantDetail = null
    },

    startPolling(scheduleId) {
      this.stopPolling()
      this.fetchMonitoringDetail(scheduleId) // initial fetch
      this.pollingInterval = setInterval(async () => {
        if (!this.refreshing) { // prevent overlapping
          await this.fetchMonitoringDetail(scheduleId, true)
        }
      }, 20000) // 20 seconds
    },

    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },
    
    resetState() {
      this.stopPolling()
      this.schedules = []
      this.currentSchedule = null
      this.participants = []
      this.searchQuery = ''
      this.statusFilter = 'SEMUA'
      this.participantDetail = null
    },

    async resetParticipantTime(scheduleId, participantId) {
      try {
        const response = await api.post(`${this.apiPrefix}/monitoring/${scheduleId}/participants/${participantId}/reset-time`)
        return response.data
      } catch (err) {
        throw new Error(err.response?.data?.message || 'Gagal mereset waktu ujian peserta.')
      }
    }
  }
})
