import { defineStore } from 'pinia'
import api from '@/services/api'

export const useStudentAccountStore = defineStore('studentAccount', {
  state: () => ({
    students: [],
    loading: false,
    generating: false,
    resetting: false,
    updatingStatus: false
  }),
  actions: {
    async fetchStudentAccounts(filters = {}) {
      this.loading = true
      try {
        const query = new URLSearchParams()
        if (filters.search) query.append('search', filters.search)
        if (filters.classId) query.append('classId', filters.classId)
        if (filters.accountStatus) query.append('accountStatus', filters.accountStatus)
        
        const { data } = await api.get(`/admin/student-accounts?${query.toString()}`)
        this.students = data.data.items || []
        return this.students
      } catch (error) {
        console.error('Failed to fetch student accounts:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async generateAccounts(payload) {
      this.generating = true
      try {
        const { data } = await api.post('/admin/student-accounts/generate', payload)
        return data.data
      } catch (error) {
        console.error('Failed to generate accounts:', error)
        throw error
      } finally {
        this.generating = false
      }
    },
    async resetPassword(studentId) {
      this.resetting = true
      try {
        const { data } = await api.post(`/admin/student-accounts/${studentId}/reset-password`)
        return data.data
      } catch (error) {
        console.error('Failed to reset password:', error)
        throw error
      } finally {
        this.resetting = false
      }
    },
    async updateStatus(studentId, isActive) {
      this.updatingStatus = true
      try {
        const { data } = await api.patch(`/admin/student-accounts/${studentId}/status`, { isActive })
        const idx = this.students.findIndex(s => s.studentId === studentId)
        if (idx !== -1 && this.students[idx].account) {
          this.students[idx].account.isActive = isActive
        }
        return data.data
      } catch (error) {
        console.error('Failed to update status:', error)
        throw error
      } finally {
        this.updatingStatus = false
      }
    }
  }
})
