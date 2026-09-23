import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAssignmentStore = defineStore('assignment', {
  state: () => ({
    assignments: [],
    loading: false
  }),
  getters: {
    allEnrichedAssignments(state) {
      return state.assignments
    }
  },
  actions: {
    async fetchAssignmentsByExamId(examId) {
      this.loading = true
      try {
        const { data } = await api.get(`/exams/${examId}/assignments`)
        this.assignments = data.data
        return data.data
      } catch (error) {
        console.error('Failed to fetch assignments:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchTeacherAssignments() {
      this.loading = true
      try {
        const { data } = await api.get('/teacher/assignments')
        this.assignments = data.data
        return data.data
      } catch (error) {
        console.error('Failed to fetch teacher assignments:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchTeacherAssignmentById(id) {
      this.loading = true
      try {
        const { data } = await api.get(`/teacher/assignments/${id}`)
        return data.data
      } catch (error) {
        console.error('Failed to fetch teacher assignment by id:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async fetchAllAssignments() {
      this.loading = true
      try {
        const { data } = await api.get('/assignments')
        this.assignments = data.data
        return data.data
      } catch (error) {
        console.error('Failed to fetch all assignments:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async createAssignment(payload) {
      this.loading = true
      try {
        const { data } = await api.post(`/exams/${payload.examId}/assignments`, payload)
        this.assignments.unshift(data.data)
        return data.data
      } catch (error) {
        console.error('Failed to create assignment:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async updateAssignment(id, payload) {
      this.loading = true
      try {
        const { data } = await api.put(`/assignments/${id}`, payload)
        const index = this.assignments.findIndex(a => a.id === parseInt(id))
        if (index !== -1) {
          this.assignments[index] = data.data
        }
        return data.data
      } catch (error) {
        console.error('Failed to update assignment:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async deleteAssignment(id) {
      this.loading = true
      try {
        await api.delete(`/assignments/${id}`)
        this.assignments = this.assignments.filter(a => a.id !== parseInt(id))
        return true
      } catch (error) {
        console.error('Failed to delete assignment:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
