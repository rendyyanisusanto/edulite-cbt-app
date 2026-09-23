import { defineStore } from 'pinia'
import api from '@/services/api'

export const useExamStore = defineStore('exam', {
  state: () => ({
    exams: [],
    loading: false
  }),
  actions: {
    async fetchExams() {
      this.loading = true
      try {
        const { data } = await api.get('/exams')
        this.exams = data.data
        return this.exams
      } catch (error) {
        console.error('Failed to fetch exams:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async getExamById(id) {
      this.loading = true
      try {
        const { data } = await api.get(`/exams/${id}`)
        return data.data
      } catch (error) {
        console.error('Failed to fetch exam:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createExam(examData) {
      this.loading = true
      try {
        const { data } = await api.post('/exams', examData)
        this.exams.unshift(data.data)
        return data.data
      } catch (error) {
        console.error('Failed to create exam:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateExam(id, examData) {
      this.loading = true
      try {
        const { data } = await api.put(`/exams/${id}`, examData)
        const index = this.exams.findIndex(e => e.id === parseInt(id))
        if (index !== -1) {
          this.exams[index] = data.data
        }
        return data.data
      } catch (error) {
        console.error('Failed to update exam:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteExam(id) {
      this.loading = true
      try {
        await api.delete(`/exams/${id}`)
        this.exams = this.exams.filter(e => e.id !== parseInt(id))
        return true
      } catch (error) {
        console.error('Failed to delete exam:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
