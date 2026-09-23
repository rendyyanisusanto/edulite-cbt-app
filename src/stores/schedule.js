import { defineStore } from 'pinia'
import api from '@/services/api'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    currentSchedule: null,
    participants: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchSchedules() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/admin/schedules')
        this.schedules = response.data.data.schedules
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal memuat jadwal'
        console.error('Error fetching schedules:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchScheduleDetail(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/admin/schedules/${id}`)
        this.currentSchedule = response.data.data.schedule
        this.participants = response.data.data.participants
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal memuat detail jadwal'
        console.error('Error fetching schedule detail:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async createSchedule(payload) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/admin/schedules', payload)
        await this.fetchSchedules()
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal membuat jadwal'
        console.error('Error creating schedule:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateSchedule(id, payload) {
      this.loading = true
      this.error = null
      try {
        const response = await api.put(`/admin/schedules/${id}`, payload)
        await this.fetchScheduleDetail(id)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengupdate jadwal'
        console.error('Error updating schedule:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteSchedule(id) {
      this.loading = true
      this.error = null
      try {
        await api.delete(`/admin/schedules/${id}`)
        await this.fetchSchedules()
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal menghapus jadwal'
        console.error('Error deleting schedule:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async syncParticipants(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post(`/admin/schedules/${id}/sync-participants`, {})
        await this.fetchScheduleDetail(id)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal sinkronisasi peserta'
        console.error('Error syncing participants:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateEligibility(scheduleId, participantId, isEligible) {
      try {
        await api.put(`/admin/schedules/${scheduleId}/participants/${participantId}/eligibility`, { isEligible })
        // Update local state without re-fetching everything
        const pt = this.participants.find(p => p.participantId === participantId)
        if (pt) {
          pt.is_eligible = isEligible ? 1 : 0
        }
      } catch (error) {
        console.error('Error updating eligibility:', error)
        throw error
      }
    }
  }
})
